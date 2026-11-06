-- Read-only, per-account aggregates. Financial tables remain private.
CREATE SCHEMA IF NOT EXISTS ideahire_analytics;
REVOKE ALL ON SCHEMA ideahire_analytics FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA ideahire_analytics TO authenticated;

CREATE OR REPLACE FUNCTION ideahire_analytics.my_work_statistics(
  p_months integer DEFAULT 6,
  p_role text DEFAULT 'contractor'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_month date := date_trunc('month', now() AT TIME ZONE 'Europe/Warsaw')::date;
  v_start date;
  v_since timestamptz;
  v_result jsonb;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF p_months IS NULL OR p_months NOT IN (0, 3, 6, 12)
     OR p_role IS NULL OR p_role NOT IN ('contractor', 'client') THEN
    RAISE EXCEPTION 'Invalid statistics period or role' USING ERRCODE = '22023';
  END IF;
  IF p_months = 0 THEN
    SELECT least(v_month, date_trunc('month', created_at AT TIME ZONE 'Europe/Warsaw')::date)
      INTO v_start FROM public.profiles WHERE id = v_user;
    v_start := coalesce(v_start, v_month);
  ELSE
    v_start := (v_month - make_interval(months => p_months - 1))::date;
  END IF;
  v_since := v_start::timestamp AT TIME ZONE 'Europe/Warsaw';

  WITH owned AS MATERIALIZED (
    SELECT c.id, c.created_at, c.negotiation_closed_at
    FROM public.conversations c
    WHERE (p_role = 'contractor' AND c.contractor_id = v_user)
       OR (p_role = 'client' AND c.client_id = v_user)
  ), completions AS MATERIALIZED (
    SELECT j.conversation_id, j.completed_at
    FROM public.ideahire_completed_jobs j
    WHERE ((p_role = 'contractor' AND j.contractor_id = v_user)
        OR (p_role = 'client' AND j.client_id = v_user))
      AND j.completed_at >= v_since AND j.completed_at <= now()
  ), reviews AS MATERIALIZED (
    SELECT r.rating, r.created_at
    FROM public.ideahire_job_reviews r
    WHERE ((p_role = 'contractor' AND r.contractor_id = v_user)
        OR (p_role = 'client' AND r.client_id = v_user))
      AND r.moderation_status = 'visible'
      AND r.created_at >= v_since AND r.created_at <= now()
  ), payments AS MATERIALIZED (
    SELECT p.stripe_livemode,
      CASE WHEN p_role = 'contractor' THEN p.released_at ELSE p.paid_at END AS effective_at,
      CASE WHEN p_role = 'client' THEN greatest(0, p.total_amount_grosz - p.refunded_amount_grosz)
        WHEN p.status IN ('released', 'partially_refunded')
          AND p.released_at IS NOT NULL AND p.stripe_transfer_id IS NOT NULL
        THEN coalesce((
          SELECT a.contractor_target FROM ideahire_finance.actions a
          WHERE a.payment_id = p.id AND a.state = 'completed'
          ORDER BY a.completed_at DESC, a.id DESC LIMIT 1
        ), p.contractor_amount_grosz)
        ELSE 0 END AS amount_grosz
    FROM public.ideahire_payments p
    WHERE (p_role = 'contractor' AND p.contractor_id = v_user)
       OR (p_role = 'client' AND p.client_id = v_user)
  ), calendar AS (
    SELECT d::date AS month
    FROM generate_series(v_start::timestamp, v_month::timestamp, interval '1 month') d
  ), monthly AS (
    SELECT m.month,
      (SELECT count(*) FROM owned c
       WHERE c.created_at >= (m.month::timestamp AT TIME ZONE 'Europe/Warsaw')
         AND c.created_at < ((m.month + interval '1 month') AT TIME ZONE 'Europe/Warsaw')
         AND c.created_at <= now()) AS started,
      (SELECT count(*) FROM completions j
       WHERE j.completed_at >= (m.month::timestamp AT TIME ZONE 'Europe/Warsaw')
         AND j.completed_at < ((m.month + interval '1 month') AT TIME ZONE 'Europe/Warsaw')) AS completed,
      (SELECT count(*) FROM owned c
       WHERE c.negotiation_closed_at >= (m.month::timestamp AT TIME ZONE 'Europe/Warsaw')
         AND c.negotiation_closed_at < ((m.month + interval '1 month') AT TIME ZONE 'Europe/Warsaw')
         AND c.negotiation_closed_at <= now()) AS withdrawn
    FROM calendar m
  )
  SELECT jsonb_build_object(
    'user_id', v_user,
    'role', p_role,
    'generated_at', now(),
    'period_start', v_start,
    'period_end', (now() AT TIME ZONE 'Europe/Warsaw')::date,
    'month_count', (SELECT count(*) FROM calendar),
    'started', (SELECT count(*) FROM owned WHERE created_at >= v_since AND created_at <= now()),
    'completed', (SELECT count(*) FROM completions),
    'withdrawn', (SELECT count(*) FROM owned WHERE negotiation_closed_at >= v_since AND negotiation_closed_at <= now()),
    'active_now', (SELECT count(*) FROM owned c WHERE c.negotiation_closed_at IS NULL
      AND EXISTS (SELECT 1 FROM public.conversation_agreements a WHERE a.conversation_id = c.id AND a.status = 'accepted')
      AND NOT EXISTS (SELECT 1 FROM public.ideahire_completed_jobs j WHERE j.conversation_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM public.ideahire_payments p WHERE p.conversation_id = c.id AND p.status = 'refunded')),
    'average_per_month', round((SELECT count(*)::numeric FROM completions) / greatest(1, (SELECT count(*) FROM calendar)), 2),
    'amount_grosz', (SELECT coalesce(sum(amount_grosz), 0) FROM payments WHERE stripe_livemode IS TRUE AND effective_at >= v_since AND effective_at <= now()),
    'test_amount_grosz', (SELECT coalesce(sum(amount_grosz), 0) FROM payments WHERE stripe_livemode IS FALSE AND effective_at >= v_since AND effective_at <= now()),
    'currency', 'PLN',
    'review_count', (SELECT count(*) FROM reviews),
    'average_rating', (SELECT round(avg(rating), 2) FROM reviews),
    'rating_distribution', (SELECT jsonb_agg(jsonb_build_object('rating', s, 'count', (SELECT count(*) FROM reviews WHERE rating = s)) ORDER BY s DESC) FROM generate_series(1, 5) s),
    'monthly', (SELECT jsonb_agg(jsonb_build_object('month', to_char(month, 'YYYY-MM'), 'started', started, 'completed', completed, 'withdrawn', withdrawn) ORDER BY month) FROM monthly)
  ) INTO v_result;
  RETURN v_result;
END
$function$;

REVOKE ALL ON FUNCTION ideahire_analytics.my_work_statistics(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION ideahire_analytics.my_work_statistics(integer, text) TO authenticated;

-- Public API wrapper does not elevate its caller's privileges.
CREATE OR REPLACE FUNCTION public.get_my_ideahire_work_statistics(
  p_months integer DEFAULT 6,
  p_role text DEFAULT 'contractor'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT ideahire_analytics.my_work_statistics(p_months, p_role);
$function$;
REVOKE ALL ON FUNCTION public.get_my_ideahire_work_statistics(integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_ideahire_work_statistics(integer, text) TO authenticated;
COMMENT ON FUNCTION public.get_my_ideahire_work_statistics(integer, text) IS
  'Read-only aggregates for auth.uid() only. Calendar months in Europe/Warsaw. Test Stripe payments are separate; no bank balance or tax-income claim.';
