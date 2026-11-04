-- Sandbox-only PostgreSQL regression checks. No Stripe API calls.
-- Requires an already completed private PARTIAL_POST QA fixture.
-- Every mutation is rolled back, including each individual case.
BEGIN;
DO $qa$
DECLARE
 a ideahire_finance.actions%rowtype; flow ideahire_finance.actions%rowtype; payment_uuid uuid; tc jsonb; checks jsonb:='[]';
 accepted boolean; expected boolean; passed boolean; error_text text; result jsonb;
 prior_events bigint; later_events bigint; blocked boolean;
BEGIN
 ASSERT (SELECT livemode=false FROM ideahire_finance.settings WHERE singleton),
  'This regression suite is sandbox-only';
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 SELECT p.id INTO payment_uuid FROM ideahire_finance.actions f
 JOIN public.ideahire_payments p ON p.id=f.payment_id JOIN public.jobs j ON j.id=p.job_id
 WHERE p.stripe_livemode=false AND f.livemode=false
  AND j.title='CODEX_QA_20261026_PARTIAL_POST' AND f.state='completed'
  AND f.outcome='partial_refund' AND f.original_transfer IS NOT NULL
 ORDER BY f.created_at DESC LIMIT 1;
 ASSERT payment_uuid IS NOT NULL,'Completed private QA fixture is required';
 PERFORM 1 FROM public.ideahire_payments WHERE id=payment_uuid FOR UPDATE;
 SELECT * INTO STRICT a FROM ideahire_finance.actions
 WHERE payment_id=payment_uuid AND state='completed' AND outcome='partial_refund'
 ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 ASSERT a.lease IS NOT NULL AND a.refund_status='succeeded'
  AND a.reversal_id IS NOT NULL AND a.reversal_amount=a.work-a.contractor_target,
  'The baseline must contain genuine completed refund and reversal checkpoints';

 FOR tc IN SELECT value FROM jsonb_array_elements('[
  {"name":"valid_completion_clears_retry","accept":true},
  {"name":"completed_repeat_clears_retry","accept":true},
  {"name":"missing_lease","accept":false},
  {"name":"missing_expiry","accept":false},
  {"name":"infinite_expiry","accept":false},
  {"name":"expired_lease","accept":false},
  {"name":"wrong_lease","accept":false},
  {"name":"missing_refund_status","accept":false},
  {"name":"pending_refund","accept":false},
  {"name":"failed_refund","accept":false},
  {"name":"missing_refund_id","accept":false},
  {"name":"missing_reversal_id","accept":false},
  {"name":"wrong_reversal_amount","accept":false},
  {"name":"missing_reversal_amount","accept":false},
  {"name":"wrong_refunded_amount","accept":false},
  {"name":"wrong_contractor_amount","accept":false},
  {"name":"unprivileged_completion","accept":false}
 ]'::jsonb)
 LOOP
  BEGIN
   UPDATE ideahire_finance.actions SET
    state=CASE WHEN tc->>'name'='completed_repeat_clears_retry' THEN 'completed' ELSE 'processing' END,
    lease=CASE WHEN tc->>'name'='missing_lease' THEN NULL ELSE a.lease END,
    lease_until=CASE tc->>'name'
      WHEN 'missing_expiry' THEN NULL WHEN 'infinite_expiry' THEN 'infinity'::timestamptz
      WHEN 'expired_lease' THEN now()-interval '1 second' ELSE now()+interval '5 minutes' END,
    refund_id=CASE WHEN tc->>'name'='missing_refund_id' THEN NULL ELSE a.refund_id END,
    refund_status=CASE tc->>'name' WHEN 'missing_refund_status' THEN NULL
      WHEN 'pending_refund' THEN 'pending' WHEN 'failed_refund' THEN 'failed' ELSE a.refund_status END,
    reversal_id=CASE WHEN tc->>'name'='missing_reversal_id' THEN NULL ELSE a.reversal_id END,
    reversal_amount=CASE tc->>'name' WHEN 'wrong_reversal_amount' THEN a.reversal_amount-1
      WHEN 'missing_reversal_amount' THEN NULL ELSE a.reversal_amount END
   WHERE id=a.id;
   INSERT INTO ideahire_finance.queue_errors(decision_id,next_attempt,message)
    VALUES(a.decision_id,now()+interval '15 minutes','Private rollback regression retry')
    ON CONFLICT(decision_id) DO UPDATE SET message=EXCLUDED.message;
   SELECT count(*) INTO prior_events FROM public.ideahire_payment_events
    WHERE payment_id=a.payment_id AND event_type='dispute_financial_action_completed';
   PERFORM set_config('request.jwt.claim.role',
    CASE WHEN tc->>'name'='unprivileged_completion' THEN 'authenticated' ELSE 'service_role' END,true);
   accepted:=false; error_text:=NULL; expected:=(tc->>'accept')::boolean;
   BEGIN
    result:=public.ideahire_finish_dispute_payment(a.id,
     CASE WHEN tc->>'name'='missing_lease' THEN NULL
          WHEN tc->>'name'='wrong_lease' THEN gen_random_uuid() ELSE a.lease END,
     CASE WHEN tc->>'name'='wrong_refunded_amount' THEN a.refund_total-1 ELSE a.refund_total END,
     CASE WHEN tc->>'name'='wrong_contractor_amount' THEN a.contractor_target-1 ELSE a.contractor_target END);
    accepted:=result->>'state'='completed';
   EXCEPTION WHEN OTHERS THEN error_text:=SQLERRM;
   END;
   passed:=accepted=expected;
   SELECT count(*) INTO later_events FROM public.ideahire_payment_events
    WHERE payment_id=a.payment_id AND event_type='dispute_financial_action_completed';
   IF expected AND accepted THEN
    passed:=passed AND NOT EXISTS(SELECT 1 FROM ideahire_finance.queue_errors WHERE decision_id=a.decision_id)
     AND later_events=prior_events+CASE WHEN tc->>'name'='completed_repeat_clears_retry' THEN 0 ELSE 1 END;
   ELSE
    passed:=passed AND later_events=prior_events;
   END IF;
   checks:=checks||jsonb_build_array(jsonb_build_object('case',tc->>'name',
    'passed',passed,'accepted',accepted,'expected_accept',expected,'error',error_text));
   RAISE EXCEPTION USING ERRCODE='ZQA01',MESSAGE='Rollback this QA case';
  EXCEPTION WHEN SQLSTATE 'ZQA01' THEN NULL;
  END;
 END LOOP;

 BEGIN
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  PERFORM public.ideahire_note_financial_queue_error(a.decision_id,'Late error after already completed settlement');
  checks:=checks||jsonb_build_array(jsonb_build_object('case','late_error_does_not_requeue_completed',
    'passed',NOT EXISTS(SELECT 1 FROM ideahire_finance.queue_errors WHERE decision_id=a.decision_id)));
  RAISE EXCEPTION USING ERRCODE='ZQA01',MESSAGE='Rollback this QA case';
 EXCEPTION WHEN SQLSTATE 'ZQA01' THEN NULL;
 END;

 BEGIN
  PERFORM set_config('request.jwt.claim.role','service_role',true);
  UPDATE ideahire_finance.actions SET state='processing' WHERE id=a.id;
  PERFORM public.ideahire_note_financial_queue_error(a.decision_id,repeat('q',600));
  checks:=checks||jsonb_build_array(jsonb_build_object('case','active_error_retains_backoff_and_bounded_message',
    'passed',EXISTS(SELECT 1 FROM ideahire_finance.queue_errors WHERE decision_id=a.decision_id
     AND length(message)=500 AND next_attempt BETWEEN now()+interval '14 minutes' AND now()+interval '16 minutes')));
  RAISE EXCEPTION USING ERRCODE='ZQA01',MESSAGE='Rollback this QA case';
 EXCEPTION WHEN SQLSTATE 'ZQA01' THEN NULL;
 END;

 BEGIN
  PERFORM set_config('request.jwt.claim.role','anon',true); blocked:=false;
  BEGIN
   PERFORM public.ideahire_note_financial_queue_error(a.decision_id,'Unauthorized test');
  EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
  END;
  checks:=checks||jsonb_build_array(jsonb_build_object('case','unprivileged_error_recording_rejected','passed',blocked));
  RAISE EXCEPTION USING ERRCODE='ZQA01',MESSAGE='Rollback this QA case';
 EXCEPTION WHEN SQLSTATE 'ZQA01' THEN NULL;
 END;

 -- Check both other genuine completed full-refund flows with their existing
 -- provider checkpoints. These database-only repetitions also roll back.
 FOR flow IN
  SELECT DISTINCT ON ((f.original_transfer IS NOT NULL)) f.*
  FROM ideahire_finance.actions f JOIN public.ideahire_payments p ON p.id=f.payment_id
  JOIN public.jobs j ON j.id=p.job_id
  WHERE p.stripe_livemode=false AND f.livemode=false
   AND j.title LIKE 'CODEX_QA_%' AND f.state='completed'
   AND f.outcome='full_refund' AND f.refund_status='succeeded' AND f.lease IS NOT NULL
  ORDER BY (f.original_transfer IS NOT NULL),f.created_at
 LOOP
  BEGIN
   PERFORM set_config('request.jwt.claim.role','service_role',true);
   PERFORM 1 FROM public.ideahire_payments WHERE id=flow.payment_id FOR UPDATE;
   PERFORM 1 FROM ideahire_finance.actions WHERE id=flow.id AND state='completed' FOR UPDATE;
   ASSERT FOUND,'Full-refund QA fixture changed';
   UPDATE ideahire_finance.actions SET state='processing',lease_until=now()+interval '5 minutes'
    WHERE id=flow.id;
   INSERT INTO ideahire_finance.queue_errors(decision_id,next_attempt,message)
    VALUES(flow.decision_id,now()+interval '15 minutes','Private rollback full-refund regression')
    ON CONFLICT(decision_id) DO UPDATE SET message=EXCLUDED.message;
   SELECT count(*) INTO prior_events FROM public.ideahire_payment_events
    WHERE payment_id=flow.payment_id AND event_type='dispute_financial_action_completed';
   accepted:=false;error_text:=NULL;
   BEGIN
    result:=public.ideahire_finish_dispute_payment(flow.id,flow.lease,flow.refund_total,flow.contractor_target);
    accepted:=result->>'state'='completed';
   EXCEPTION WHEN OTHERS THEN error_text:=SQLERRM;
   END;
   SELECT count(*) INTO later_events FROM public.ideahire_payment_events
    WHERE payment_id=flow.payment_id AND event_type='dispute_financial_action_completed';
   checks:=checks||jsonb_build_array(jsonb_build_object(
    'case',CASE WHEN flow.original_transfer IS NULL THEN 'full_refund_before_transfer_completion'
      ELSE 'full_refund_after_transfer_completion' END,
    'passed',accepted AND later_events=prior_events+1
      AND NOT EXISTS(SELECT 1 FROM ideahire_finance.queue_errors WHERE decision_id=flow.decision_id),
    'accepted',accepted,'error',error_text));
   RAISE EXCEPTION USING ERRCODE='ZQA01',MESSAGE='Rollback this QA case';
  EXCEPTION WHEN SQLSTATE 'ZQA01' THEN NULL;
  END;
 END LOOP;
 PERFORM set_config('ideahire.qa.completion_results',checks::text,true);
END $qa$;
SELECT jsonb_build_object(
 'checks',jsonb_array_length(current_setting('ideahire.qa.completion_results')::jsonb),
 'passed',(SELECT count(*) FROM jsonb_array_elements(current_setting('ideahire.qa.completion_results')::jsonb)c WHERE (c->>'passed')::boolean),
 'all_passed',NOT EXISTS(SELECT 1 FROM jsonb_array_elements(current_setting('ideahire.qa.completion_results')::jsonb)c WHERE NOT coalesce((c->>'passed')::boolean,false)),
 'results',current_setting('ideahire.qa.completion_results')::jsonb) AS result;
ROLLBACK;

