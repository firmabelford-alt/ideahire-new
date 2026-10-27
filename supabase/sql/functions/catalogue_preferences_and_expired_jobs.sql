-- IdeaHire: all offered categories, atomic preferences, explicit renewal of expired listings.
-- No existing user rows are changed by installing these functions.
ALTER TABLE public.ideahire_discovery_preferences
  DROP CONSTRAINT IF EXISTS ideahire_discovery_preferences_categories_values_check;
ALTER TABLE public.ideahire_discovery_preferences
  ADD CONSTRAINT ideahire_discovery_preferences_categories_values_check CHECK (
    preferred_categories <@ ARRAY[
      'Programowanie','Grafika i design','Marketing','Copywriting','Video','Fotografia',
      'AI i automatyzacje','Dane, analizy i research','Biznes i e-commerce','Architektura, wnętrza i CAD'
    ]::text[]
  );

CREATE OR REPLACE FUNCTION public.save_my_ideahire_discovery_preferences(p_usage_preference text, p_preferred_categories text[], p_personalization_enabled boolean DEFAULT true, p_onboarding_action text DEFAULT 'complete'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_usage_preference text;
  v_categories text[] := '{}'::text[];
  v_personalization_enabled boolean;
  v_action text;
  v_result public.ideahire_discovery_preferences%rowtype;
begin
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Zaloguj się, aby zapisać preferencje.';
  end if;

  if exists (
    select 1
    from public.ideahire_account_lifecycle lifecycle_row
    where lifecycle_row.user_id = v_user_id
      and lifecycle_row.status in (
        'closure_pending',
        'closed'
      )
  ) then
    raise exception using
      errcode = 'P0001',
      message =
        'Nie można zmienić preferencji podczas zamykania konta.';
  end if;

  v_action :=
    lower(
      trim(
        coalesce(
          p_onboarding_action,
          'complete'
        )
      )
    );

  if v_action not in ('complete', 'skip') then
    raise exception using
      errcode = 'P0001',
      message =
        'Nieprawidłowy sposób zakończenia konfiguracji.';
  end if;

  if v_action = 'skip' then
    v_usage_preference := 'both';
    v_categories := '{}'::text[];
    v_personalization_enabled := false;
  else
    v_usage_preference :=
      lower(
        trim(
          coalesce(
            p_usage_preference,
            ''
          )
        )
      );

    if v_usage_preference not in (
      'find_work',
      'hire_talent',
      'both'
    ) then
      raise exception using
        errcode = 'P0001',
        message =
          'Wybierz sposób korzystania z IdeaHire.';
    end if;

    select coalesce(
      array_agg(
        category_name
        order by category_name
      ),
      '{}'::text[]
    )
    into v_categories
    from (
      select distinct
        trim(category_value) as category_name
      from unnest(
        coalesce(
          p_preferred_categories,
          '{}'::text[]
        )
      ) as category_value
      where nullif(
        trim(category_value),
        ''
      ) is not null
    ) normalized_categories;

    if cardinality(v_categories) > 3 then
      raise exception using
        errcode = 'P0001',
        message =
          'Możesz wybrać maksymalnie 3 kategorie.';
    end if;

    if exists (
      select 1
      from unnest(v_categories) as category_value
      where not category_value = any(
        array[
          'Programowanie',
          'Grafika i design',
          'Marketing',
          'Copywriting',
          'Video',
          'Fotografia',
          'AI i automatyzacje',
          'Dane, analizy i research',
          'Biznes i e-commerce',
          'Architektura, wnętrza i CAD'
        ]::text[]
      )
    ) then
      raise exception using
        errcode = 'P0001',
        message =
          'Wybrano kategorię, której IdeaHire nie obsługuje.';
    end if;

    v_personalization_enabled :=
      coalesce(
        p_personalization_enabled,
        true
      );
  end if;

  insert into public.ideahire_discovery_preferences (
    user_id,
    usage_preference,
    preferred_categories,
    personalization_enabled,
    preference_version,
    onboarding_completed_at,
    onboarding_skipped_at
  )
  values (
    v_user_id,
    v_usage_preference,
    v_categories,
    v_personalization_enabled,
    '2026-09-13-v1',

    case
      when v_action = 'complete'
        then now()
      else null
    end,

    case
      when v_action = 'skip'
        then now()
      else null
    end
  )
  on conflict (user_id)
  do update set
    usage_preference =
      excluded.usage_preference,

    preferred_categories =
      excluded.preferred_categories,

    personalization_enabled =
      excluded.personalization_enabled,

    preference_version =
      excluded.preference_version,

    onboarding_completed_at =
      excluded.onboarding_completed_at,

    onboarding_skipped_at =
      excluded.onboarding_skipped_at

  returning *
  into v_result;

  return jsonb_build_object(
    'saved', true,
    'needs_onboarding', false,
    'usage_preference',
      v_result.usage_preference,
    'preferred_categories',
      to_jsonb(v_result.preferred_categories),
    'personalization_enabled',
      v_result.personalization_enabled,
    'preference_version',
      v_result.preference_version,
    'onboarding_completed_at',
      v_result.onboarding_completed_at,
    'onboarding_skipped_at',
      v_result.onboarding_skipped_at,
    'updated_at',
      v_result.updated_at
  );
end;
$function$;


-- Each save is one transaction. Failure in either existing function rolls both writes back.
CREATE OR REPLACE FUNCTION public.save_my_ideahire_preferences(
  p_role_preference text,
  p_preferred_categories text[],
  p_freelancer_categories text[],
  p_client_categories text[],
  p_onboarding_goals text[],
  p_specialty_summary text,
  p_project_readiness text,
  p_personalization_enabled boolean DEFAULT true,
  p_onboarding_action text DEFAULT 'complete'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE v_preferences jsonb; v_profile jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Zaloguj się, aby zapisać preferencje.' USING ERRCODE='42501';
  END IF;
  v_preferences := public.save_my_ideahire_discovery_preferences(
    p_role_preference,p_preferred_categories,p_personalization_enabled,p_onboarding_action
  );
  v_profile := public.save_my_ideahire_onboarding_profile(
    p_role_preference,p_freelancer_categories,p_client_categories,p_onboarding_goals,
    p_specialty_summary,p_project_readiness,p_onboarding_action
  );
  RETURN jsonb_build_object('preferences',v_preferences,'profile',v_profile);
END;
$function$;
REVOKE ALL ON FUNCTION public.save_my_ideahire_preferences(text,text[],text[],text[],text[],text,text,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_my_ideahire_preferences(text,text[],text[],text[],text[],text,text,boolean,text) TO authenticated;

-- RLS and all existing account/age/moderation triggers remain effective.
CREATE OR REPLACE FUNCTION public.renew_my_ideahire_job(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE v_user_id uuid := auth.uid(); v_job public.jobs%rowtype;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Zaloguj się, aby ponownie opublikować ogłoszenie.' USING ERRCODE='42501';
  END IF;
  IF public.ideahire_has_active_restriction(v_user_id) THEN
    RAISE EXCEPTION 'Publikacja jest niedostępna podczas zawieszenia konta.' USING ERRCODE='42501';
  END IF;
  -- The existing full-account mutation trigger checks lifecycle and age on UPDATE.

  SELECT * INTO v_job FROM public.jobs WHERE id=p_job_id AND user_id=v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono tego ogłoszenia na Twoim koncie.' USING ERRCODE='42501';
  END IF;
  IF v_job.visibility IS DISTINCT FROM 'public' OR v_job.source_type IS DISTINCT FROM 'client_posted' THEN
    RAISE EXCEPTION 'Prywatny projekt nie jest ogłoszeniem do ponownej publikacji.' USING ERRCODE='22023';
  END IF;
  IF public.ideahire_job_has_republication_hold(v_job.id) THEN
    RAISE EXCEPTION 'Najpierw sprawdź decyzję dotyczącą publikacji w statusie konta.' USING ERRCODE='42501';
  END IF;
  -- Idempotent: a concurrent click cannot extend an already active listing.
  IF v_job.expires_at > statement_timestamp() THEN
    RETURN jsonb_build_object('renewed',false,'job',jsonb_build_object(
      'id',v_job.id,'created_at',v_job.created_at,'expires_at',v_job.expires_at));
  END IF;
  IF v_job.listing_duration_days IS NULL OR v_job.listing_duration_days NOT IN (7,14,30) THEN
    RAISE EXCEPTION 'Sprawdź czas publikacji ogłoszenia przed jego przywróceniem.' USING ERRCODE='22023';
  END IF;
  -- The existing listing trigger recalculates expires_at using the original duration.
  -- Title, scope, budget, images, visibility and conversation links stay intact.
  UPDATE public.jobs SET created_at=statement_timestamp()
  WHERE id=v_job.id AND user_id=v_user_id
  RETURNING * INTO v_job;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publikacja nie została potwierdzona.' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object('renewed',true,'job',jsonb_build_object(
    'id',v_job.id,'created_at',v_job.created_at,'expires_at',v_job.expires_at));
END;
$function$;
REVOKE ALL ON FUNCTION public.renew_my_ideahire_job(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renew_my_ideahire_job(uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';

