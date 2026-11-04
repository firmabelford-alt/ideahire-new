-- IdeaHire: require complete settlement proofs and keep retry state consistent.
-- This patch makes no Stripe API call and does not change amounts or deadlines.
CREATE OR REPLACE FUNCTION public.ideahire_finish_dispute_payment(p_id uuid, p_lease uuid, p_refunded bigint, p_contractor bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE a ideahire_finance.actions%rowtype; p public.ideahire_payments%rowtype; final_status text; payment_uuid uuid;
BEGIN
 PERFORM ideahire_finance.service_only();
 SELECT payment_id INTO payment_uuid FROM ideahire_finance.actions WHERE id=p_id;
 SELECT * INTO p FROM public.ideahire_payments WHERE id=payment_uuid FOR UPDATE;
 SELECT * INTO a FROM ideahire_finance.actions WHERE id=p_id FOR UPDATE;
 IF a.state='completed' THEN
  DELETE FROM ideahire_finance.queue_errors WHERE decision_id=a.decision_id;
  RETURN to_jsonb(a)-'lease';
 END IF;
 -- NULL comparisons must never turn an incomplete confirmation into success.
 IF a.id IS NULL OR p.id IS NULL OR p_lease IS NULL OR a.lease IS NULL
 OR a.lease_until IS NULL OR NOT isfinite(a.lease_until)
 OR a.lease IS DISTINCT FROM p_lease OR a.lease_until<=now() OR a.state<>'processing'
 OR p_refunded IS DISTINCT FROM a.refund_total OR p_contractor IS DISTINCT FROM a.contractor_target
 OR (a.refund_total>0 AND (a.refund_id IS NULL OR a.refund_status IS DISTINCT FROM 'succeeded'))
 OR (a.contractor_target>0 AND coalesce(a.original_transfer,a.transfer_id) IS NULL)
 OR (a.original_transfer IS NOT NULL AND a.work>a.contractor_target
  AND (a.reversal_id IS NULL OR a.reversal_amount IS DISTINCT FROM a.work-a.contractor_target)) THEN RAISE EXCEPTION 'Brak końcowego potwierdzenia Stripe.'; END IF;
 IF EXISTS(SELECT 1 FROM ideahire_finance.stripe_disputes WHERE payment_id=p.id AND status NOT IN ('won','warning_closed')) THEN RAISE EXCEPTION 'Rozliczenie blokuje spór bankowy.'; END IF;
 final_status:=CASE WHEN a.refund_total=a.total THEN 'refunded' WHEN a.refund_total>0 THEN 'partially_refunded' ELSE 'released' END;
 UPDATE ideahire_finance.actions SET state='completed',completed_at=now(),lease_until=NULL,last_error=NULL WHERE id=a.id;
 UPDATE public.ideahire_payments SET status=final_status,refunded_amount_grosz=a.refund_total,
 stripe_refund_id=coalesce(a.refund_id,stripe_refund_id),stripe_transfer_id=coalesce(a.original_transfer,a.transfer_id,stripe_transfer_id),
 stripe_charge_id=a.charge_id,refunded_at=CASE WHEN a.refund_total>0 THEN now() ELSE refunded_at END,
 released_at=CASE WHEN a.contractor_target>0 THEN coalesce(released_at,now()) ELSE released_at END,last_error_code=NULL,last_error_message=NULL WHERE id=p.id;
 UPDATE public.dispute_decisions SET payment_action_status='completed' WHERE id=a.decision_id;
 DELETE FROM ideahire_finance.queue_errors WHERE decision_id=a.decision_id;
 INSERT INTO public.ideahire_payment_events(payment_id,event_type,actor_user_id,details)
 VALUES(p.id,'dispute_financial_action_completed',a.actor_id,jsonb_build_object('action_id',a.id,'refund_grosz',a.refund_total,'contractor_grosz',a.contractor_target,'refund_id',a.refund_id,'transfer_id',coalesce(a.original_transfer,a.transfer_id)));
 INSERT INTO public.dispute_statements(dispute_id,author_role,statement_type,visibility,body)
 VALUES(a.dispute_id,'system','system','parties','Stripe potwierdził rozliczenie decyzji: zwrot klientowi '||to_char(a.refund_total::numeric/100,'FM9999990.00')||' zł; wynagrodzenie wykonawcy po rozliczeniu '||to_char(a.contractor_target::numeric/100,'FM9999990.00')||' zł. Przekazanie na saldo Stripe nie jest potwierdzeniem wpływu na rachunek bankowy.');
 PERFORM public.ideahire_write_audit(a.actor_id,'admin','dispute_payment_completed',a.dispute_id,NULL,jsonb_build_object('action_id',a.id));
 RETURN (SELECT to_jsonb(x)-'lease' FROM ideahire_finance.actions x WHERE id=a.id);
END $function$
;

CREATE OR REPLACE FUNCTION public.ideahire_note_financial_queue_error(p_decision uuid, p_message text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE action_state text;
BEGIN
 PERFORM ideahire_finance.service_only();
 -- Use the same payment -> action lock order as finalization. This also
 -- serializes an error from an older request against a successful completion.
 PERFORM 1 FROM public.ideahire_payments p
 JOIN public.disputes d ON d.agreement_id=p.agreement_id
 JOIN public.dispute_decisions decision ON decision.dispute_id=d.id
 WHERE decision.id=p_decision FOR UPDATE OF p;
 SELECT state INTO action_state FROM ideahire_finance.actions
 WHERE decision_id=p_decision FOR UPDATE;
 IF action_state='completed' THEN
  DELETE FROM ideahire_finance.queue_errors WHERE decision_id=p_decision;
  RETURN;
 END IF;
 INSERT INTO ideahire_finance.queue_errors(decision_id,next_attempt,message) VALUES(p_decision,now()+interval '15 minutes',left(p_message,500))
 ON CONFLICT(decision_id) DO UPDATE SET next_attempt=EXCLUDED.next_attempt,message=EXCLUDED.message;
END $function$
;

REVOKE ALL ON FUNCTION public.ideahire_finish_dispute_payment(uuid,uuid,bigint,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideahire_finish_dispute_payment(uuid,uuid,bigint,bigint) TO service_role;
REVOKE ALL ON FUNCTION public.ideahire_note_financial_queue_error(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ideahire_note_financial_queue_error(uuid,text) TO service_role;

-- Clear only resolved retry entries. Keep the previous error in the audit trail.
WITH cleared AS (
 DELETE FROM ideahire_finance.queue_errors q USING ideahire_finance.actions a
 WHERE a.decision_id=q.decision_id AND a.state='completed'
 RETURNING q.decision_id,q.message,q.next_attempt
)
INSERT INTO public.ideahire_payment_events(payment_id,event_type,actor_user_id,details)
SELECT a.payment_id,'settlement_retry_error_resolved',a.actor_id,
 jsonb_build_object('action_id',a.id,'decision_id',a.decision_id,
  'previous_message',c.message,'previous_next_attempt',c.next_attempt,
  'reason','Settlement is already completed; preserve history without scheduling another retry')
FROM cleared c JOIN ideahire_finance.actions a ON a.decision_id=c.decision_id;

