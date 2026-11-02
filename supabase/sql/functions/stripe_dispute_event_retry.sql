CREATE OR REPLACE FUNCTION public.ideahire_observe_financial_event(p_event_id text, p_type text, p_object jsonb, p_livemode boolean, p_created bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE p public.ideahire_payments%rowtype; a ideahire_finance.actions%rowtype; pid uuid; oid text:=p_object->>'id';
 charge text; intent text; state_name text; old_created bigint; old_state text; amount bigint; reversed bigint; expected bigint; adjust_failed boolean;
BEGIN
 PERFORM ideahire_finance.service_only();
 IF p_type NOT IN ('charge.refunded','refund.created','refund.updated','refund.failed','charge.dispute.created','charge.dispute.updated','charge.dispute.closed','transfer.created','transfer.updated','transfer.reversed') THEN RETURN false; END IF;
 IF p_event_id !~ '^evt_[A-Za-z0-9]+$' OR p_created IS NULL OR p_livemode IS NULL THEN RAISE EXCEPTION 'Błędny event.'; END IF;
 IF p_object->'metadata'->>'payment_id' ~ '^[0-9a-f-]{36}$' THEN pid:=(p_object->'metadata'->>'payment_id')::uuid; END IF;
 charge:=CASE WHEN p_object->>'object'='charge' THEN oid ELSE CASE WHEN jsonb_typeof(p_object->'charge')='object' THEN p_object->'charge'->>'id' ELSE p_object->>'charge' END END;
 intent:=CASE WHEN jsonb_typeof(p_object->'payment_intent')='object' THEN p_object->'payment_intent'->>'id' ELSE p_object->>'payment_intent' END;
 SELECT * INTO p FROM public.ideahire_payments x WHERE (pid IS NOT NULL AND x.id=pid)
 OR (pid IS NULL AND (x.stripe_charge_id=charge OR x.stripe_payment_intent_id=intent OR x.stripe_transfer_id=oid)) LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN
  -- Stripe does not guarantee ordering: the payment ID can be saved after this event.
  -- Returning success here would discard a bank dispute permanently.
  IF p_type LIKE 'charge.dispute.%' THEN
   RAISE EXCEPTION 'Płatność sporu bankowego nie jest jeszcze zapisana. Ponów zdarzenie po zapisaniu płatności.';
  END IF;
  RETURN p_type LIKE 'refund.%';
 END IF;
 IF p.stripe_livemode IS DISTINCT FROM p_livemode OR lower(p.currency) IS DISTINCT FROM p_object->>'currency' THEN RAISE EXCEPTION 'Inny tryb lub waluta eventu.'; END IF;
 SELECT * INTO a FROM ideahire_finance.actions WHERE payment_id=p.id FOR UPDATE;
 IF a.id IS NULL AND p_type NOT LIKE 'refund.%' AND p_type NOT LIKE 'charge.dispute.%' THEN RETURN false; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ideahire_stripe:'||p_event_id,0));
 IF EXISTS(SELECT 1 FROM public.ideahire_payment_events WHERE stripe_event_id=p_event_id) THEN RETURN true; END IF;
 IF p_type LIKE 'charge.dispute.%' THEN
  IF p_object->>'object'<>'dispute' OR oid!~'^(dp|du)_[A-Za-z0-9]+$' OR charge IS DISTINCT FROM p.stripe_charge_id
   OR (p_object->>'amount')::bigint>p.total_amount_grosz THEN RAISE EXCEPTION 'Niezgodny spór bankowy.'; END IF;
  state_name:=p_object->>'status';
  IF state_name NOT IN ('warning_needs_response','warning_under_review','warning_closed','needs_response','under_review','won','lost') THEN RAISE EXCEPTION 'Nieznany stan sporu bankowego.'; END IF;
  SELECT event_created,status INTO old_created,old_state FROM ideahire_finance.stripe_disputes WHERE id=oid;
  IF old_created IS NULL OR p_created>old_created OR (p_created=old_created AND state_name IN ('won','lost','warning_closed')) THEN
   INSERT INTO ideahire_finance.stripe_disputes(id,payment_id,status,event_created) VALUES(oid,p.id,state_name,p_created)
   ON CONFLICT(id) DO UPDATE SET status=EXCLUDED.status,event_created=EXCLUDED.event_created,updated_at=now();
   IF state_name IN ('won','warning_closed') AND NOT EXISTS(SELECT 1 FROM ideahire_finance.stripe_disputes WHERE payment_id=p.id AND status NOT IN ('won','warning_closed')) THEN
    IF p.last_error_code LIKE 'stripe_bank_dispute%' THEN
     UPDATE public.ideahire_payments SET status=CASE WHEN a.id IS NOT NULL AND a.state<>'completed' THEN 'disputed'
      WHEN refunded_amount_grosz=total_amount_grosz THEN 'refunded' WHEN refunded_amount_grosz>0 THEN 'partially_refunded'
      WHEN stripe_transfer_id IS NOT NULL THEN 'released' WHEN release_requested_at IS NOT NULL THEN 'release_pending'
      WHEN work_submitted_at IS NOT NULL THEN 'work_submitted' ELSE 'funds_secured' END,
      last_error_code=CASE WHEN a.id IS NOT NULL AND a.state<>'completed' THEN 'stripe_bank_dispute_review' ELSE NULL END,
      last_error_message=CASE WHEN a.id IS NOT NULL AND a.state<>'completed' THEN 'Spór bankowy zakończono. Wcześniejsza operacja wymaga uzgodnienia przed wznowieniem.' ELSE NULL END WHERE id=p.id;
    END IF;
   ELSE
    UPDATE public.ideahire_payments SET status='disputed',last_error_code='stripe_bank_dispute_'||state_name,
     last_error_message='Stripe zgłosił spór bankowy: '||state_name||'. Nie wykonuj dodatkowego zwrotu bez uzgodnienia rozliczenia Stripe.' WHERE id=p.id;
    IF a.id IS NOT NULL THEN
     UPDATE ideahire_finance.actions SET state='needs_review',last_error='Spór bankowy Stripe: '||state_name WHERE id=a.id;
     UPDATE public.dispute_decisions SET payment_action_status='failed' WHERE id=a.decision_id;
    END IF;
   END IF;
  END IF;
 ELSIF a.id IS NOT NULL AND p_type LIKE 'refund.%' THEN
  IF p_object->'metadata'->>'ideahire_action_id' IS DISTINCT FROM a.id::text OR oid!~'^(re|pyr)_[A-Za-z0-9]+$'
   OR (p_object->>'amount')::bigint IS DISTINCT FROM a.refund_total OR intent IS DISTINCT FROM a.payment_intent
   OR (a.refund_id IS NOT NULL AND a.refund_id<>oid) THEN RAISE EXCEPTION 'Niezgodny zwrot rozliczenia.'; END IF;
  UPDATE ideahire_finance.actions SET refund_id=oid,
   refund_status=CASE
    WHEN refund_status IN ('failed','canceled') THEN refund_status
    WHEN state='completed' AND p_object->>'status' NOT IN ('failed','canceled') THEN refund_status
    ELSE p_object->>'status' END WHERE id=a.id;
  IF p_object->>'status' IN ('failed','canceled') THEN
   -- Accounting idempotency cannot depend on refund_status: a checkpoint may
   -- record the terminal status before its webhook arrives.
   adjust_failed:=a.completed_at IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.ideahire_payment_events e
    WHERE e.payment_id=p.id AND e.event_type='failed_refund_amount_reconciled'
     AND e.details->>'refund_id'=oid);
   UPDATE ideahire_finance.actions SET state='needs_review',last_error='Stripe zgłosił nieudany zwrot. Wymagana kontrola tej operacji.' WHERE id=a.id;
   UPDATE public.dispute_decisions SET payment_action_status='failed' WHERE id=a.decision_id;
   -- A completed refund can fail later. Remove its credited amount once;
   -- retain other refunds and do not debit again on duplicate events.
   UPDATE public.ideahire_payments SET status='disputed',
    refunded_amount_grosz=CASE
     WHEN adjust_failed
      THEN greatest(0,refunded_amount_grosz-a.refund_total)
     ELSE refunded_amount_grosz END,
    refunded_at=CASE
     WHEN adjust_failed
      AND refunded_amount_grosz<=a.refund_total THEN NULL
     ELSE refunded_at END,
    last_error_code='stripe_refund_failed',
    last_error_message='Stripe zgłosił nieudany zwrot. Sprawdź tę operację przed dalszym rozliczeniem.' WHERE id=p.id;
   IF adjust_failed THEN
    INSERT INTO public.ideahire_payment_events(payment_id,event_type,details)
    VALUES(p.id,'failed_refund_amount_reconciled',jsonb_build_object(
     'action_id',a.id,'refund_id',oid,'previous_grosz',p.refunded_amount_grosz,
     'corrected_grosz',greatest(0,p.refunded_amount_grosz-a.refund_total),
     'reason','Terminal refund failure after a completed settlement'));
   END IF;
  END IF;
 ELSIF a.id IS NULL AND p_type LIKE 'refund.%' THEN
  IF p_object->>'object'<>'refund' OR oid!~'^(re|pyr)_[A-Za-z0-9]+$'
   OR charge IS DISTINCT FROM p.stripe_charge_id OR intent IS DISTINCT FROM p.stripe_payment_intent_id
   OR (p_object->>'amount')::bigint IS NULL OR (p_object->>'amount')::bigint<=0
   OR (p_object->>'amount')::bigint>p.total_amount_grosz THEN RAISE EXCEPTION 'Niezgodny zwrot poza planem rozliczenia.'; END IF;
  -- A refund issued outside the IdeaHire decision has no verified settlement plan.
  -- Retain the recorded amounts for reconciliation; never claim final completion.
  UPDATE public.ideahire_payments SET status='disputed',last_error_code='external_refund_requires_reconciliation',
   last_error_message='Zwrot zlecono poza rozliczeniem decyzji IdeaHire. Kwoty i status wymagają potwierdzenia przez operatora w Stripe.' WHERE id=p.id;
 ELSIF a.id IS NOT NULL AND p_type='charge.refunded' THEN
  IF p_object->>'object'<>'charge' OR (p_object->>'amount')::bigint IS DISTINCT FROM a.total OR intent IS DISTINCT FROM a.payment_intent THEN RAISE EXCEPTION 'Niezgodne obciążenie zwrotu.'; END IF;
  amount:=(p_object->>'amount_refunded')::bigint;
  IF amount>a.refund_total THEN
   UPDATE ideahire_finance.actions SET state='needs_review',last_error='Dodatkowy zwrot poza planem rozliczenia.' WHERE id=a.id;
   UPDATE public.ideahire_payments SET status='disputed',refunded_amount_grosz=greatest(refunded_amount_grosz,amount),last_error_code='external_refund_during_settlement',last_error_message='Zwroty Stripe przekraczają plan. Wymagana kontrola operatora.' WHERE id=p.id;
  END IF;
 ELSIF a.id IS NOT NULL AND p_type LIKE 'transfer.%' THEN
  amount:=(p_object->>'amount')::bigint; reversed:=(p_object->>'amount_reversed')::bigint;
  IF p_object->>'object'<>'transfer' OR p_object->>'destination' IS DISTINCT FROM a.destination
   OR p_object->>'source_transaction' IS DISTINCT FROM a.charge_id THEN RAISE EXCEPTION 'Niezgodny transfer.'; END IF;
  IF oid=a.original_transfer THEN expected:=a.work-a.contractor_target;
   IF amount<>a.work OR reversed>expected THEN
    UPDATE ideahire_finance.actions SET state='needs_review',last_error='Transfer odwrócony poza planem.' WHERE id=a.id;
    UPDATE public.ideahire_payments SET status='disputed',last_error_code='external_transfer_reversal',last_error_message='Transfer zmienił się poza planem rozliczenia.' WHERE id=p.id;
   END IF;
  ELSIF p_object->'metadata'->>'ideahire_action_id'=a.id::text AND amount=a.contractor_target AND reversed=0 THEN
   IF a.transfer_id IS NOT NULL AND a.transfer_id<>oid THEN RAISE EXCEPTION 'Drugi transfer tej operacji.'; END IF;
   UPDATE ideahire_finance.actions SET transfer_id=oid WHERE id=a.id;
  ELSE RAISE EXCEPTION 'Transfer nie odpowiada tej operacji.';
  END IF;
 END IF;
 INSERT INTO public.ideahire_payment_events(payment_id,event_type,stripe_event_id,details)
 VALUES(p.id,'finance_observed_'||replace(p_type,'.','_'),p_event_id,jsonb_build_object('object_id',oid,'action_id',a.id,'status',p_object->>'status'));
 RETURN true;
END $function$
;

REVOKE ALL ON FUNCTION public.ideahire_observe_financial_event(text,text,jsonb,boolean,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ideahire_observe_financial_event(text,text,jsonb,boolean,bigint) TO service_role;
