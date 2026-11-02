CREATE OR REPLACE FUNCTION public.ideahire_dispute_checkpoint(p_id uuid, p_lease uuid, p_step text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE a ideahire_finance.actions%rowtype; identifier text:=p_data->>'id';
BEGIN
 PERFORM ideahire_finance.service_only();
 SELECT * INTO a FROM ideahire_finance.actions WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR p_lease IS NULL OR a.lease IS NULL OR a.lease_until IS NULL OR a.lease IS DISTINCT FROM p_lease OR a.lease_until<=now() OR a.state<>'processing' THEN RAISE EXCEPTION 'Rezerwacja operacji wygasła.'; END IF;
 IF p_step='start_reversal' THEN
  IF a.reversal_started<now()-interval '23 hours' AND a.reversal_id IS NULL THEN RAISE EXCEPTION 'Stare niepotwierdzone odwrócenie wymaga kontroli operatora.'; END IF;
  IF (p_data->>'amount')::bigint<=0 OR (p_data->>'amount')::bigint>a.work THEN RAISE EXCEPTION 'Błędne odwrócenie.'; END IF;
  IF a.reversal_amount IS NOT NULL AND a.reversal_amount<>(p_data->>'amount')::bigint THEN RAISE EXCEPTION 'Nie można zmienić parametrów ponowienia.'; END IF;
  UPDATE ideahire_finance.actions SET reversal_started=coalesce(reversal_started,now()),reversal_amount=(p_data->>'amount')::bigint WHERE id=p_id;
 ELSIF p_step='start_refund' THEN
  IF a.refund_started<now()-interval '23 hours' AND a.refund_id IS NULL THEN RAISE EXCEPTION 'Stary niepotwierdzony zwrot wymaga kontroli operatora.'; END IF;
  UPDATE ideahire_finance.actions SET refund_started=coalesce(refund_started,now()) WHERE id=p_id;
 ELSIF p_step='start_transfer' THEN
  IF a.transfer_started<now()-interval '23 hours' AND a.transfer_id IS NULL THEN RAISE EXCEPTION 'Stary niepotwierdzony transfer wymaga kontroli operatora.'; END IF;
  UPDATE ideahire_finance.actions SET transfer_started=coalesce(transfer_started,now()) WHERE id=p_id;
 ELSIF p_step='reversal' AND identifier~'^trr_[A-Za-z0-9]+$' AND (a.reversal_id IS NULL OR a.reversal_id=identifier) THEN
  UPDATE ideahire_finance.actions SET reversal_id=identifier WHERE id=p_id;
 ELSIF p_step='refund' AND identifier~'^(re|pyr)_[A-Za-z0-9]+$' AND (a.refund_id IS NULL OR a.refund_id=identifier)
  AND (p_data->>'status') IN ('pending','requires_action','succeeded','failed','canceled') THEN
  -- Late API responses must not resurrect a terminal failure recorded by a webhook.
  UPDATE ideahire_finance.actions SET refund_id=identifier,
   refund_status=CASE
    WHEN refund_status IN ('failed','canceled') THEN refund_status
    WHEN refund_status='succeeded' AND p_data->>'status' NOT IN ('failed','canceled') THEN refund_status
    ELSE p_data->>'status' END WHERE id=p_id;
 ELSIF p_step='transfer' AND identifier~'^tr_[A-Za-z0-9]+$' AND (a.transfer_id IS NULL OR a.transfer_id=identifier) THEN
  UPDATE ideahire_finance.actions SET transfer_id=identifier WHERE id=p_id;
 ELSIF p_step='charge' AND identifier~'^(ch|py)_[A-Za-z0-9]+$' AND (a.charge_id IS NULL OR a.charge_id=identifier) THEN
  UPDATE ideahire_finance.actions SET charge_id=identifier WHERE id=p_id;
 ELSE RAISE EXCEPTION 'Nieprawidłowy etap rozliczenia.';
 END IF;
 RETURN (SELECT to_jsonb(x) FROM ideahire_finance.actions x WHERE id=p_id);
END $function$
;

REVOKE ALL ON FUNCTION public.ideahire_dispute_checkpoint(uuid,uuid,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ideahire_dispute_checkpoint(uuid,uuid,text,jsonb) TO service_role;

