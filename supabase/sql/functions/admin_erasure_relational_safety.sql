-- Preserve related inquiry, agreement, payment and moderation history; keep existing staff authorization.
CREATE OR REPLACE FUNCTION public.ideahire_build_erasure_inventory(p_target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'storage'
AS $function$
declare
  v_profile_count integer := 0;
  v_public_profile_count integer := 0;
  v_avatar_count integer := 0;
  v_age_count integer := 0;
  v_legal_acceptance_count integer := 0;
  v_open_privacy_count integer := 0;
  v_other_open_privacy_count integer := 0;
  v_payment_count integer := 0;
  v_active_payment_count integer := 0;
  v_dispute_count integer := 0;
  v_active_dispute_count integer := 0;
  v_conversation_count integer := 0;
  v_message_count integer := 0;
  v_agreement_count integer := 0;
  v_active_agreement_count integer := 0;
  v_application_count integer := 0;
  v_pending_application_count integer := 0;
  v_job_count integer := 0;
  v_stripe_count integer := 0;
  v_active_moderation_count integer := 0;
  v_active_staff boolean := false;
  v_preference_count integer := 0;
  v_block_count integer := 0;
  v_dispute_notification_count integer := 0;
  v_removable_application_count integer := 0;
  v_removable_message_count integer := 0;
  v_removable_conversation_count integer := 0;
  v_removable_job_count integer := 0;
  v_unused_stripe_count integer := 0;
  v_portfolio_rows integer:=0;
  v_portfolio_media_rows integer:=0;
  v_discovery_rows integer:=0;
  v_onboarding_rows integer:=0;
  v_lucyna_preference_rows integer:=0;
  v_lucyna_thread_rows integer:=0;
  v_profile_discovery_rows integer:=0;
  v_service_rows integer:=0;
  v_services_total integer:=0;
  v_service_inquiries_total integer:=0;
  v_portfolio_total integer:=0;
  v_auth_metadata_key_count integer := 0;
  v_inbound_block_count integer := 0;
begin
  if p_target_user_id is null
     or not exists (
       select 1
       from auth.users
       where id = p_target_user_id
     ) then
    raise exception using
      errcode = 'P0001',
      message = 'Nie znaleziono konta użytkownika.';
  end if;

  select count(*) into v_portfolio_rows from public.ideahire_portfolio_items i where i.user_id=p_target_user_id
    and not exists(select 1 from public.ideahire_content_reports r where r.portfolio_item_id=i.id)
    and not exists(select 1 from public.ideahire_portfolio_media m where m.portfolio_item_id=i.id and
      (m.user_id is distinct from p_target_user_id or exists(select 1 from public.ideahire_content_reports r where r.portfolio_media_id=m.id)));
  select count(*) into v_portfolio_media_rows from public.ideahire_portfolio_media m where m.user_id=p_target_user_id and not exists(select 1 from public.ideahire_content_reports r where r.portfolio_media_id=m.id or r.portfolio_item_id=m.portfolio_item_id);
  select count(*) into v_portfolio_total from public.ideahire_portfolio_items where user_id=p_target_user_id;
  select count(*) into v_discovery_rows from public.ideahire_discovery_preferences where user_id=p_target_user_id;
  select count(*) into v_onboarding_rows from public.ideahire_onboarding_profiles where user_id=p_target_user_id;
  select count(*) into v_lucyna_preference_rows from public.ideahire_lucyna_v2_preferences where user_id=p_target_user_id;
  select count(*) into v_lucyna_thread_rows from public.ideahire_lucyna_v2_threads where user_id=p_target_user_id;
  select count(*) into v_profile_discovery_rows from public.ideahire_profile_discovery where user_id=p_target_user_id;
  select count(*) into v_service_rows from public.freelancer_services s where s.freelancer_id=p_target_user_id
    and not exists(select 1 from public.service_inquiries r where r.service_id=s.id)
    and not exists(select 1 from public.service_reservations r where r.service_id=s.id);
  select count(*) into v_services_total from public.freelancer_services where freelancer_id=p_target_user_id;
  select count(*) into v_service_inquiries_total from public.service_inquiries where client_id=p_target_user_id or freelancer_id=p_target_user_id;

  select count(*) into v_profile_count
  from public.profiles
  where id = p_target_user_id;

  select count(*) into v_public_profile_count
  from public.public_profiles
  where user_id = p_target_user_id;

  select count(*) into v_auth_metadata_key_count
  from auth.users u cross join lateral jsonb_each(coalesce(u.raw_user_meta_data,'{}'::jsonb)) m
  where u.id=p_target_user_id and m.value<>'null'::jsonb;

  select count(*) into v_avatar_count
  from storage.objects object_row
  where object_row.bucket_id = 'avatars'
    and (
      object_row.owner_id = p_target_user_id::text
      or object_row.name like p_target_user_id::text || '/%'
    )

    and not exists (
      select 1 from public.ideahire_portfolio_items i
      where i.image_path=object_row.name
        and (exists(select 1 from public.ideahire_content_reports r where r.portfolio_item_id=i.id)
          or exists(select 1 from public.ideahire_portfolio_media m join public.ideahire_content_reports r on r.portfolio_media_id=m.id where m.portfolio_item_id=i.id))
    )
    and not exists (
      select 1 from public.ideahire_portfolio_media m
      where m.image_path=object_row.name
        and exists(select 1 from public.ideahire_content_reports r where r.portfolio_media_id=m.id or r.portfolio_item_id=m.portfolio_item_id)
    );

  select count(*) into v_age_count
  from public.ideahire_age_profiles
  where user_id = p_target_user_id
    and (
      date_of_birth is not null
      or age_notice_version is not null
      or age_notice_acknowledged_at is not null
    );

  select count(*) into v_preference_count
  from public.conversation_user_state
  where user_id = p_target_user_id;

  select count(*) into v_block_count
  from public.user_blocks
  where blocker_id = p_target_user_id;

  select count(*) into v_inbound_block_count
  from public.user_blocks where blocked_id = p_target_user_id and blocker_id <> p_target_user_id;

  select count(*) into v_dispute_notification_count
  from public.dispute_notifications
  where user_id = p_target_user_id;

  select count(*) into v_legal_acceptance_count
  from public.ideahire_legal_acceptances
  where user_id = p_target_user_id;

  select
    count(*),
    count(*) filter (where request_type <> 'erasure')
  into v_open_privacy_count, v_other_open_privacy_count
  from public.ideahire_privacy_requests
  where requester_user_id = p_target_user_id
    and status not in (
      'completed',
      'partially_completed',
      'rejected',
      'withdrawn'
    );

  select
    count(*),
    count(*) filter (
      where status not in (
        'released',
        'refunded',
        'failed',
        'cancelled'
      )
    )
  into v_payment_count, v_active_payment_count
  from public.ideahire_payments
  where client_id = p_target_user_id
     or contractor_id = p_target_user_id;

  select
    count(*),
    count(*) filter (
      where status not in ('closed', 'cancelled')
    )
  into v_dispute_count, v_active_dispute_count
  from public.disputes
  where client_id = p_target_user_id
     or contractor_id = p_target_user_id
     or opened_by = p_target_user_id;

  select count(*) into v_conversation_count
  from public.conversations
  where client_id = p_target_user_id
     or contractor_id = p_target_user_id;

  select count(*) into v_message_count
  from public.messages message_row
  join public.conversations conversation_row
    on conversation_row.id = message_row.conversation_id
  where conversation_row.client_id = p_target_user_id
     or conversation_row.contractor_id = p_target_user_id;

  select count(*) into v_agreement_count
  from public.conversation_agreements agreement_row
  join public.conversations conversation_row
    on conversation_row.id = agreement_row.conversation_id
  where conversation_row.client_id = p_target_user_id
     or conversation_row.contractor_id = p_target_user_id;

  select count(*) into v_active_agreement_count
  from public.conversation_agreements agreement_row
  join public.conversations conversation_row
    on conversation_row.id = agreement_row.conversation_id
  where (
      conversation_row.client_id = p_target_user_id
      or conversation_row.contractor_id = p_target_user_id
    )
    and agreement_row.status = 'accepted'
    and not exists (
      select 1
      from public.ideahire_payments payment_row
      where payment_row.agreement_id = agreement_row.id
        and payment_row.status in (
          'released',
          'refunded',
          'failed',
          'cancelled'
        )
    );

  select
    count(*),
    count(*) filter (where status = 'pending')
  into v_application_count, v_pending_application_count
  from public.job_applications
  where applicant_id = p_target_user_id;

  select count(*) into v_job_count
  from public.jobs
  where user_id = p_target_user_id;

  select count(*) into v_stripe_count
  from public.ideahire_stripe_accounts
  where user_id = p_target_user_id
    and (
      stripe_account_id is not null
      or onboarding_status <> 'not_started'
      or details_submitted
      or charges_enabled
      or payouts_enabled
    );

  select count(*) into v_unused_stripe_count
  from public.ideahire_stripe_accounts
  where user_id = p_target_user_id
    and stripe_account_id is null
    and onboarding_status = 'not_started'
    and not details_submitted
    and not charges_enabled
    and not payouts_enabled;

  select count(*) into v_active_moderation_count
  from public.ideahire_moderation_cases moderation_row
  where moderation_row.target_user_id = p_target_user_id
    and (
      (
        moderation_row.status = 'scheduled'
        and moderation_row.effective_at > now()
      )
      or (
        moderation_row.status = 'active'
        and (
          moderation_row.ends_at is null
          or moderation_row.ends_at > now()
        )
      )
    );

  select exists (
    select 1
    from public.ideahire_staff staff_row
    where staff_row.user_id = p_target_user_id
      and staff_row.is_active = true
  ) into v_active_staff;

  select count(*) into v_removable_application_count
  from public.job_applications application_row
  where application_row.applicant_id = p_target_user_id
    and application_row.status <> 'accepted'
    and not exists (
      select 1
      from public.conversations conversation_row
      where conversation_row.job_id = application_row.job_id
        and conversation_row.contractor_id = p_target_user_id
    );

  select count(*) into v_removable_message_count from public.messages message_row where message_row.sender_id=p_target_user_id
    and not exists (select 1 from public.dispute_message_evidence e where e.message_id=message_row.id)
    and not exists (select 1 from public.conversation_agreements e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_payments e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.disputes e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_content_reports e where e.conversation_id=message_row.conversation_id or e.message_id=message_row.id)
    and not exists (select 1 from public.ideahire_private_report_evidence e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_work_deliveries e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_shared_items s where s.message_id=message_row.id
      and (s.delivery_id is not null or exists(select 1 from public.ideahire_content_reports r where r.shared_item_id=s.id)));

  select count(*) into v_removable_conversation_count from public.conversations conversation_row
  where (conversation_row.client_id=p_target_user_id or conversation_row.contractor_id=p_target_user_id)
    and not exists (select 1 from public.conversation_agreements keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_payments keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.disputes keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.service_inquiries keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_content_reports keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_private_report_evidence keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_profile_inquiries keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_profile_contact_requests keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_work_deliveries keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_shared_items keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists(select 1 from public.messages message_row where message_row.conversation_id=conversation_row.id
      and (message_row.sender_id=p_target_user_id
    and not exists (select 1 from public.dispute_message_evidence e where e.message_id=message_row.id)
    and not exists (select 1 from public.conversation_agreements e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_payments e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.disputes e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_content_reports e where e.conversation_id=message_row.conversation_id or e.message_id=message_row.id)
    and not exists (select 1 from public.ideahire_private_report_evidence e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_work_deliveries e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_shared_items s where s.message_id=message_row.id
      and (s.delivery_id is not null or exists(select 1 from public.ideahire_content_reports r where r.shared_item_id=s.id)))) is not true);

  select count(*) into v_removable_job_count from public.jobs job_row where job_row.user_id=p_target_user_id
    and not exists (select 1 from public.job_applications keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.conversations keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.ideahire_payments keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.disputes keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.ideahire_moderation_cases keep_row where keep_row.source_job_id=job_row.id)
    and not exists (select 1 from public.ideahire_moderation_notices keep_row where keep_row.source_job_id=job_row.id)
    and not exists (select 1 from public.service_inquiries keep_row where keep_row.hidden_job_id=job_row.id)
    and not exists (select 1 from public.ideahire_profile_inquiries keep_row where keep_row.project_job_id=job_row.id)
    and not exists (select 1 from public.ideahire_job_republication_holds keep_row where keep_row.job_id=job_row.id);

  return jsonb_build_object(
    'scope_version','2026-10-28',
    'target_user_id', p_target_user_id,
    'generated_at', now(),
    'can_close_account', not (
      v_active_staff
      or v_job_count > 0
      or v_pending_application_count > 0
      or v_active_payment_count > 0
      or v_active_dispute_count > 0
      or v_active_agreement_count > 0
      or v_active_moderation_count > 0
      or v_other_open_privacy_count > 0
      or v_stripe_count > 0
    ),
    'execution_blocked',
      v_active_staff
      or v_job_count > 0
      or v_pending_application_count > 0
      or v_active_payment_count > 0
      or v_active_dispute_count > 0
      or v_active_agreement_count > 0
      or v_active_moderation_count > 0
      or v_other_open_privacy_count > 0
      or v_stripe_count > 0,
    'blockers', jsonb_build_object(
      'active_staff_account', v_active_staff,
      'published_jobs', v_job_count,
      'pending_job_applications', v_pending_application_count,
      'active_payments', v_active_payment_count,
      'active_disputes', v_active_dispute_count,
      'active_agreements_without_terminal_payment',
        v_active_agreement_count,
      'active_moderation_cases', v_active_moderation_count,
      'other_open_privacy_requests', v_other_open_privacy_count,
      'connected_stripe_accounts', v_stripe_count
    ),
    'erasable_now', jsonb_build_object(
      'portfolio_items',v_portfolio_rows,
      'portfolio_images',v_portfolio_media_rows,
      'discovery_preferences',v_discovery_rows,
      'onboarding_profiles',v_onboarding_rows,
      'lucyna_preferences',v_lucyna_preference_rows,
      'lucyna_threads',v_lucyna_thread_rows,
      'profile_discovery',v_profile_discovery_rows,
      'removable_services',v_service_rows,
      'private_profile_rows', v_profile_count,
      'public_profile_rows', v_public_profile_count,
      'avatar_objects', v_avatar_count,
      'age_profile_rows', v_age_count,
      'user_preference_rows', v_preference_count,
      'block_rows', v_block_count,
      'dispute_notifications', v_dispute_notification_count,
      'removable_job_applications', v_removable_application_count,
      'removable_messages', v_removable_message_count,
      'removable_conversations', v_removable_conversation_count,
      'removable_jobs', v_removable_job_count,
      'unused_stripe_rows', v_unused_stripe_count,
      'auth_optional_metadata', v_auth_metadata_key_count,
      'browser_local_preferences', 1
    ),
    'retained_for_legal_or_transactional_purposes',
      jsonb_build_object(
        'services_total',greatest(0,v_services_total-v_service_rows),
        'other_users_blocks',v_inbound_block_count,
        'service_inquiries_total',v_service_inquiries_total,
        'reported_portfolio_items',greatest(0,v_portfolio_total-v_portfolio_rows),
        'auth_login_account', 1,
        'legal_acceptances', v_legal_acceptance_count,
        'privacy_requests_open', v_open_privacy_count,
        'payments_total', v_payment_count,
        'disputes_total', v_dispute_count,
        'conversations_total', v_conversation_count,
        'messages_total', v_message_count,
        'agreements_total', v_agreement_count,
        'job_applications_total', v_application_count,
        'jobs_total', v_job_count
      )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_apply_ideahire_erasure_data(p_case_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_admin_id uuid := auth.uid();
  v_role text;
  v_case public.ideahire_erasure_cases%rowtype;
  v_profile_rows integer := 0;
  v_public_profile_rows integer := 0;
  v_age_rows integer := 0;
  v_preference_rows integer := 0;
  v_block_rows integer := 0;
  v_dispute_notification_rows integer := 0;
  v_application_rows integer := 0;
  v_message_rows integer := 0;
  v_conversation_rows integer := 0;
  v_job_rows integer := 0;
  v_unused_stripe_rows integer := 0;
  v_portfolio_rows integer:=0;
  v_portfolio_media_rows integer:=0;
  v_discovery_rows integer:=0;
  v_onboarding_rows integer:=0;
  v_lucyna_preference_rows integer:=0;
  v_lucyna_thread_rows integer:=0;
  v_profile_discovery_rows integer:=0;
  v_service_rows integer:=0;
  v_services_paused integer:=0;
  v_retained_after jsonb := '{}'::jsonb;
  v_result jsonb;
begin
  select role
  into v_role
  from public.ideahire_staff
  where user_id = v_admin_id
    and is_active = true;

  if v_role is null
     or v_role not in ('owner', 'admin') then
    raise exception using
      errcode = '42501',
      message = 'Brak uprawnień administratora.';
  end if;

  select *
  into v_case
  from public.ideahire_erasure_cases
  where id = p_case_id
  for update;

  if not found
     or v_case.status <> 'processing' then
    raise exception using
      errcode = 'P0001',
      message = 'Sprawa nie jest gotowa do wykonania.';
  end if;

  if v_role <> 'owner'
     and v_case.execution_started_by is distinct from v_admin_id then
    raise exception using
      errcode = '42501',
      message = 'Operację musi dokończyć administrator, który ją rozpoczął.';
  end if;

  if v_case.owner_approved_by is null or v_case.approved_at is null or v_case.target_user_id=v_admin_id
     or exists(select 1 from public.ideahire_staff where user_id=v_case.target_user_id and is_active=true) then
    raise exception using errcode='42501',message='Brak ważnego zatwierdzenia lub konto jest chronione.';
  end if;

  if v_case.execution_result->'data_minimization'->>'scope_version'='2026-10-28' then
    return v_case.execution_result->'data_minimization';
  end if;

  perform pg_catalog.set_config(
    'app.ideahire_erasure_operation',
    'on',
    true
  );

  delete from public.ideahire_portfolio_media m where m.user_id=v_case.target_user_id and not exists(select 1 from public.ideahire_content_reports r where r.portfolio_media_id=m.id or r.portfolio_item_id=m.portfolio_item_id);
  get diagnostics v_portfolio_media_rows=row_count;
  delete from public.ideahire_portfolio_items i where i.user_id=v_case.target_user_id
    and not exists(select 1 from public.ideahire_content_reports r where r.portfolio_item_id=i.id)
    and not exists(select 1 from public.ideahire_portfolio_media m where m.portfolio_item_id=i.id and
      (m.user_id is distinct from v_case.target_user_id or exists(select 1 from public.ideahire_content_reports r where r.portfolio_media_id=m.id)))
    and not exists(select 1 from public.ideahire_portfolio_media m where m.portfolio_item_id=i.id);
  get diagnostics v_portfolio_rows=row_count;
  delete from public.ideahire_discovery_preferences where user_id=v_case.target_user_id;
  get diagnostics v_discovery_rows=row_count;
  delete from public.ideahire_onboarding_profiles where user_id=v_case.target_user_id;
  get diagnostics v_onboarding_rows=row_count;
  delete from public.ideahire_lucyna_v2_preferences where user_id=v_case.target_user_id;
  get diagnostics v_lucyna_preference_rows=row_count;
  delete from public.ideahire_lucyna_v2_threads where user_id=v_case.target_user_id;
  get diagnostics v_lucyna_thread_rows=row_count;
  delete from public.ideahire_profile_discovery where user_id=v_case.target_user_id;
  get diagnostics v_profile_discovery_rows=row_count;
  delete from public.freelancer_services s where s.freelancer_id=v_case.target_user_id
    and not exists(select 1 from public.service_inquiries r where r.service_id=s.id)
    and not exists(select 1 from public.service_reservations r where r.service_id=s.id);
  get diagnostics v_service_rows=row_count;
  update public.freelancer_services set status='paused',updated_at=now() where freelancer_id=v_case.target_user_id and status='active';
  get diagnostics v_services_paused=row_count;

  update public.profiles
  set name = case
        when v_case.action_type = 'close_account'
          then 'Usunięte konto'
        else 'Profil bez danych'
      end,
      avatar_url = null,
      about = null,
      specialty_categories = '{}'::text[],
      specialization = null,
      skills = '{}'::text[],
      completed_jobs = 0,
      posted_jobs = 0,
      disputed_jobs = 0,
      positive_reviews = 0,
      neutral_reviews = 0,
      negative_reviews = 0,
      updated_at = now()
  where id = v_case.target_user_id;

  get diagnostics v_profile_rows = row_count;

  update public.public_profiles
  set name = case
        when v_case.action_type = 'close_account'
          then 'Usunięte konto'
        else 'Profil bez danych'
      end,
      avatar_url = null,
      bio = null,
      country_code = '',
      updated_at = now()
  where user_id = v_case.target_user_id;

  get diagnostics v_public_profile_rows = row_count;

  update public.ideahire_age_profiles
  set date_of_birth = null,
      age_notice_version = null,
      age_notice_acknowledged_at = null,
      updated_at = now()
  where user_id = v_case.target_user_id;

  get diagnostics v_age_rows = row_count;

  delete from public.conversation_user_state
  where user_id = v_case.target_user_id;

  get diagnostics v_preference_rows = row_count;

  delete from public.user_blocks
  where blocker_id = v_case.target_user_id;

  get diagnostics v_block_rows = row_count;

  delete from public.dispute_notifications
  where user_id = v_case.target_user_id;

  get diagnostics v_dispute_notification_rows = row_count;

  delete from public.job_applications application_row
  where application_row.applicant_id = v_case.target_user_id
    and application_row.status <> 'accepted'
    and not exists (
      select 1
      from public.conversations conversation_row
      where conversation_row.job_id = application_row.job_id
        and conversation_row.contractor_id = v_case.target_user_id
    );

  get diagnostics v_application_rows = row_count;

  delete from public.messages message_row where message_row.sender_id=v_case.target_user_id
    and not exists (select 1 from public.dispute_message_evidence e where e.message_id=message_row.id)
    and not exists (select 1 from public.conversation_agreements e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_payments e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.disputes e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_content_reports e where e.conversation_id=message_row.conversation_id or e.message_id=message_row.id)
    and not exists (select 1 from public.ideahire_private_report_evidence e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_work_deliveries e where e.conversation_id=message_row.conversation_id)
    and not exists (select 1 from public.ideahire_shared_items s where s.message_id=message_row.id
      and (s.delivery_id is not null or exists(select 1 from public.ideahire_content_reports r where r.shared_item_id=s.id)));

  get diagnostics v_message_rows = row_count;

  delete from public.conversations conversation_row
  where (conversation_row.client_id=v_case.target_user_id or conversation_row.contractor_id=v_case.target_user_id)
    and not exists(select 1 from public.messages m where m.conversation_id=conversation_row.id)
    and not exists (select 1 from public.conversation_agreements keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_payments keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.disputes keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.service_inquiries keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_content_reports keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_private_report_evidence keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_profile_inquiries keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_profile_contact_requests keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_work_deliveries keep_row where keep_row.conversation_id=conversation_row.id)
    and not exists (select 1 from public.ideahire_shared_items keep_row where keep_row.conversation_id=conversation_row.id);

  get diagnostics v_conversation_rows = row_count;

  delete from public.jobs job_row where job_row.user_id=v_case.target_user_id
    and not exists (select 1 from public.job_applications keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.conversations keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.ideahire_payments keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.disputes keep_row where keep_row.job_id=job_row.id)
    and not exists (select 1 from public.ideahire_moderation_cases keep_row where keep_row.source_job_id=job_row.id)
    and not exists (select 1 from public.ideahire_moderation_notices keep_row where keep_row.source_job_id=job_row.id)
    and not exists (select 1 from public.service_inquiries keep_row where keep_row.hidden_job_id=job_row.id)
    and not exists (select 1 from public.ideahire_profile_inquiries keep_row where keep_row.project_job_id=job_row.id)
    and not exists (select 1 from public.ideahire_job_republication_holds keep_row where keep_row.job_id=job_row.id);

  get diagnostics v_job_rows = row_count;

  delete from public.ideahire_stripe_accounts stripe_row
  where stripe_row.user_id = v_case.target_user_id
    and stripe_row.stripe_account_id is null
    and stripe_row.onboarding_status = 'not_started'
    and not stripe_row.details_submitted
    and not stripe_row.charges_enabled
    and not stripe_row.payouts_enabled;

  get diagnostics v_unused_stripe_rows = row_count;

  update public.ideahire_account_lifecycle
  set status = case
        when v_case.action_type = 'close_account'
          then 'closure_pending'
        else 'erasure_pending'
      end,
      data_minimized_at = now(),
      erasure_case_id = p_case_id
  where user_id = v_case.target_user_id;

  v_retained_after :=
    public.ideahire_build_erasure_inventory(v_case.target_user_id)
      -> 'retained_for_legal_or_transactional_purposes';

  insert into public.ideahire_erasure_case_events (
    case_id,
    actor_user_id,
    actor_role,
    event_type,
    visibility,
    message,
    details
  ) values (
    p_case_id,
    v_admin_id,
    v_role,
    'data_minimized',
    'internal',
    'Usunięto lub zanonimizowano pełny, relacyjnie bezpieczny zakres danych. Zachowano wyłącznie konto logowania oraz dane wymagające retencji prawnej, transakcyjnej, spornej lub bezpieczeństwa.',
    jsonb_build_object(
      'portfolio_items_deleted',v_portfolio_rows,
      'portfolio_images_deleted',v_portfolio_media_rows,
      'discovery_preferences_deleted',v_discovery_rows,
      'onboarding_profiles_deleted',v_onboarding_rows,
      'lucyna_preferences_deleted',v_lucyna_preference_rows,
      'lucyna_threads_deleted',v_lucyna_thread_rows,
      'profile_discovery_deleted',v_profile_discovery_rows,
      'services_deleted',v_service_rows,
      'services_paused',v_services_paused,
      'scope_version','2026-10-28',
      'profile_rows_anonymized', v_profile_rows,
      'public_profile_rows_anonymized', v_public_profile_rows,
      'age_rows_minimized', v_age_rows,
      'preference_rows_deleted', v_preference_rows,
      'block_rows_deleted', v_block_rows,
      'dispute_notifications_deleted', v_dispute_notification_rows,
      'job_applications_deleted', v_application_rows,
      'messages_deleted', v_message_rows,
      'conversations_deleted', v_conversation_rows,
      'jobs_deleted', v_job_rows,
      'unused_stripe_rows_deleted', v_unused_stripe_rows,
      'retained_after', v_retained_after
    )
  );

  v_result := jsonb_build_object(
    'target_user_id', v_case.target_user_id,
    'action_type', v_case.action_type,
    'portfolio_items_deleted',v_portfolio_rows,
    'portfolio_images_deleted',v_portfolio_media_rows,
    'discovery_preferences_deleted',v_discovery_rows,
    'onboarding_profiles_deleted',v_onboarding_rows,
    'lucyna_preferences_deleted',v_lucyna_preference_rows,
    'lucyna_threads_deleted',v_lucyna_thread_rows,
    'profile_discovery_deleted',v_profile_discovery_rows,
    'services_deleted',v_service_rows,
    'services_paused',v_services_paused,
    'scope_version','2026-10-28',
    'profile_rows_anonymized', v_profile_rows,
    'public_profile_rows_anonymized', v_public_profile_rows,
    'age_rows_minimized', v_age_rows,
    'preference_rows_deleted', v_preference_rows,
    'block_rows_deleted', v_block_rows,
    'dispute_notifications_deleted', v_dispute_notification_rows,
    'job_applications_deleted', v_application_rows,
    'messages_deleted', v_message_rows,
    'conversations_deleted', v_conversation_rows,
    'jobs_deleted', v_job_rows,
    'unused_stripe_rows_deleted', v_unused_stripe_rows,
    'retained_after', v_retained_after
  );
  update public.ideahire_erasure_cases set execution_result=coalesce(execution_result,'{}'::jsonb)||jsonb_build_object('data_minimization',v_result),updated_at=now() where id=p_case_id;
  return v_result;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_note_ideahire_erasure_failure(p_case_id uuid,p_stage text,p_error_code text,p_message text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog','public'
AS $function$
declare
  v_actor uuid:=auth.uid();
  v_role text;
  v_case public.ideahire_erasure_cases%rowtype;
begin
  select role into v_role from public.ideahire_staff where user_id=v_actor and is_active=true;
  if v_role is null or v_role not in ('owner','admin') then
    raise exception using errcode='42501',message='Brak uprawnień administratora.';
  end if;
  select * into v_case from public.ideahire_erasure_cases where id=p_case_id for update;
  if not found then raise exception using errcode='P0001',message='Nie znaleziono operacji.'; end if;
  if v_case.status='completed' then return; end if;
  if v_case.status<>'processing' or (v_role<>'owner' and v_case.execution_started_by is distinct from v_actor) then
    raise exception using errcode='42501',message='Brak uprawnień do zapisania wyniku tej operacji.';
  end if;
  update public.ideahire_erasure_cases
    set failure_reason=left(coalesce(p_message,'Próba wykonania została przerwana.'),500),
      execution_result=coalesce(execution_result,'{}'::jsonb)||jsonb_build_object('last_error',
        jsonb_build_object('stage',left(p_stage,80),'code',left(p_error_code,40),'at',now())),
      updated_at=now() where id=p_case_id;
  insert into public.ideahire_erasure_case_events(case_id,actor_user_id,actor_role,event_type,visibility,message,details)
    values(p_case_id,v_actor,v_role,'failed','internal',left(coalesce(p_message,'Próba wykonania została przerwana.'),500),
      jsonb_build_object('stage',left(p_stage,80),'code',left(p_error_code,40),'resumable',true));
end;
$function$;
REVOKE ALL ON FUNCTION public.admin_note_ideahire_erasure_failure(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_note_ideahire_erasure_failure(uuid,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.ideahire_build_erasure_inventory(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.admin_apply_ideahire_erasure_data(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_apply_ideahire_erasure_data(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_begin_ideahire_erasure_execution(p_case_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'storage'
AS $function$
declare
  v_admin_id uuid := auth.uid();
  v_role text;
  v_case public.ideahire_erasure_cases%rowtype;
  v_inventory jsonb;
  v_avatar_objects jsonb;
  v_resumed boolean := false;
begin
  select role
  into v_role
  from public.ideahire_staff
  where user_id = v_admin_id
    and is_active = true;

  if v_role is null
     or v_role not in ('owner', 'admin') then
    raise exception using
      errcode = '42501',
      message = 'Brak uprawnień administratora.';
  end if;

  select *
  into v_case
  from public.ideahire_erasure_cases
  where id = p_case_id
  for update;

  if not found
     or v_case.status not in ('authorized', 'processing') then
    raise exception using
      errcode = 'P0001',
      message = 'Sprawa nie jest gotowa do wykonania.';
  end if;

  if v_case.owner_approved_by is null or v_case.approved_at is null then
    raise exception using errcode='P0001',message='Brak ważnego zatwierdzenia właściciela.';
  end if;

  if v_case.target_user_id = v_admin_id
     or exists (
       select 1
       from public.ideahire_staff
       where user_id = v_case.target_user_id
         and is_active = true
     ) then
    raise exception using
      errcode = 'P0001',
      message = 'Nie można wykonać operacji na aktywnym koncie personelu.';
  end if;

  if v_case.status = 'authorized' then
    if v_role <> 'owner'
       and v_case.prepared_by is distinct from v_admin_id then
      raise exception using
        errcode = '42501',
        message = 'Wykonanie może uruchomić prowadzący administrator lub owner.';
    end if;
  else
    if v_role <> 'owner'
       and v_case.execution_started_by is distinct from v_admin_id then
      raise exception using
        errcode = '42501',
        message = 'Operację może wznowić prowadzący administrator lub owner.';
    end if;

    v_resumed := true;
  end if;

  v_inventory := public.ideahire_build_erasure_inventory(
    v_case.target_user_id
  );

  if v_case.action_type = 'close_account'
     and coalesce(
       (v_inventory ->> 'execution_blocked')::boolean,
       true
     ) then
    raise exception using
      errcode = 'P0001',
      message = 'Konta nie można jeszcze zamknąć. Najpierw zakończ zlecenia, zgłoszenia, płatności, spory, umowy i moderację oraz odłącz Stripe.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'bucket_id', object_row.bucket_id,
        'name', object_row.name
      )
      order by object_row.name
    ),
    '[]'::jsonb
  )
  into v_avatar_objects
  from storage.objects object_row
  where object_row.bucket_id = 'avatars'
    and (
      object_row.owner_id = v_case.target_user_id::text
      or object_row.name like v_case.target_user_id::text || '/%'
    )
    and not exists (
      select 1 from public.ideahire_portfolio_items i
      where i.image_path=object_row.name
        and (exists(select 1 from public.ideahire_content_reports r where r.portfolio_item_id=i.id)
          or exists(select 1 from public.ideahire_portfolio_media m join public.ideahire_content_reports r on r.portfolio_media_id=m.id where m.portfolio_item_id=i.id))
    )
    and not exists (
      select 1 from public.ideahire_portfolio_media m
      where m.image_path=object_row.name
        and exists(select 1 from public.ideahire_content_reports r where r.portfolio_media_id=m.id or r.portfolio_item_id=m.portfolio_item_id)
    );

  if not v_resumed then
    update public.ideahire_erasure_cases
    set status = 'processing',
        execution_started_by = v_admin_id,
        execution_started_at = now(),
        inventory_snapshot = v_inventory
    where id = p_case_id;

    update public.ideahire_account_lifecycle
    set status = case
          when v_case.action_type = 'close_account'
            then 'closure_pending'
          else 'erasure_pending'
        end,
        erasure_case_id = p_case_id
    where user_id = v_case.target_user_id;

    insert into public.ideahire_erasure_case_events (
      case_id,
      actor_user_id,
      actor_role,
      event_type,
      visibility,
      message
    ) values (
      p_case_id,
      v_admin_id,
      v_role,
      'execution_started',
      'internal',
      'Rozpoczęto pełne, kontrolowane usuwanie możliwych danych.'
    );

    insert into public.ideahire_admin_audit_log (
      actor_user_id,
      actor_role,
      action,
      target_user_id,
      details
    ) values (
      v_admin_id,
      v_role,
      'erasure_execution_started',
      v_case.target_user_id,
      jsonb_build_object(
        'privacy_request_id', v_case.privacy_request_id,
        'erasure_case_id', p_case_id,
        'action_type', v_case.action_type,
        'inventory', v_inventory
      )
    );
  end if;

  return jsonb_build_object(
    'case_id', p_case_id,
    'privacy_request_id', v_case.privacy_request_id,
    'target_user_id', v_case.target_user_id,
    'action_type', v_case.action_type,
    'avatar_objects', v_avatar_objects,
    'inventory', v_inventory,
    'resumed', v_resumed
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.admin_begin_ideahire_erasure_execution(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_begin_ideahire_erasure_execution(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_finalize_ideahire_erasure_case(p_case_id uuid, p_auth_soft_deleted boolean, p_execution_result jsonb DEFAULT '{}'::jsonb, p_failure_reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_admin_id uuid := auth.uid();
  v_role text;
  v_case public.ideahire_erasure_cases%rowtype;
  v_final_case_status text;
  v_request_status text;
  v_user_message text;
begin
  select role
  into v_role
  from public.ideahire_staff
  where user_id = v_admin_id
    and is_active = true;

  if v_role is null
     or v_role not in ('owner', 'admin') then
    raise exception using
      errcode = '42501',
      message = 'Brak uprawnień administratora.';
  end if;

  select *
  into v_case
  from public.ideahire_erasure_cases
  where id = p_case_id
  for update;

  if not found
     or v_case.status <> 'processing' then
    raise exception using
      errcode = 'P0001',
      message = 'Sprawa nie jest w trakcie wykonania.';
  end if;

  if v_role <> 'owner'
     and v_case.execution_started_by is distinct from v_admin_id then
    raise exception using
      errcode = '42501',
      message = 'Operację musi zakończyć administrator, który ją rozpoczął.';
  end if;

  if v_case.owner_approved_by is null or v_case.approved_at is null
     or v_case.execution_result->'data_minimization'->>'scope_version' is distinct from '2026-10-28'
     or p_execution_result->'data_minimization' is distinct from v_case.execution_result->'data_minimization'
     or (v_case.action_type='minimize_data' and nullif(trim(p_failure_reason),'') is not null) then
    raise exception using errcode='P0001',message='Brak potwierdzonego wyniku usuwania danych. Nie zakończono operacji.';
  end if;

  if v_case.action_type = 'minimize_data' then
    if p_auth_soft_deleted then
      raise exception using
        errcode = 'P0001',
        message = 'Przy usuwaniu możliwych danych konto Auth musi pozostać aktywne.';
    end if;

    v_final_case_status := 'completed';
    v_request_status := 'completed';
    v_user_message :=
      'Usunięto lub zanonimizowano dane możliwe do usunięcia, w tym dane profilu, zdjęcia, opcjonalne metadane, ustawienia i niepowiązane dane operacyjne. Konto logowania pozostaje aktywne. Dane wymagane do rozliczeń, sporów, bezpieczeństwa, obowiązków prawnych lub obrony roszczeń pozostają ograniczone zgodnie z udokumentowaną retencją.';

  elsif p_auth_soft_deleted then
    v_final_case_status := 'completed';
    v_request_status := 'completed';
    v_user_message :=
      'Konto zostało zamknięte, logowanie wyłączono, a wszystkie możliwe dane usunięto lub zanonimizowano. Dane wymagane do rozliczeń, sporów, bezpieczeństwa, obowiązków prawnych lub obrony roszczeń pozostają ograniczone zgodnie z udokumentowaną retencją.';

  else
    if char_length(
         trim(coalesce(p_failure_reason, ''))
       ) not between 10 and 2000 then
      raise exception using
        errcode = 'P0001',
        message = 'Przy nieudanym zamknięciu podaj przyczynę od 10 do 2000 znaków.';
    end if;

    v_final_case_status := 'failed';
    v_request_status := 'partially_completed';
    v_user_message :=
      'Możliwe dane zostały zminimalizowane, ale techniczne zamknięcie dostępu wymaga dokończenia przez administratora. Sprawa pozostaje odnotowana w historii.';
  end if;

  update public.ideahire_erasure_cases
  set status = v_final_case_status,
      execution_result = coalesce(
        p_execution_result,
        '{}'::jsonb
      ) || jsonb_build_object(
        'account_remains_active',
          v_case.action_type = 'minimize_data',
        'scope_version', '2026-10-28'
      ),
      failure_reason = case
        when v_final_case_status = 'failed'
          then trim(p_failure_reason)
        else null
      end,
      completed_at = now()
  where id = p_case_id;

  update public.ideahire_account_lifecycle
  set status = case
        when v_case.action_type = 'minimize_data'
          then 'active'
        when p_auth_soft_deleted
          then 'closed'
        else 'data_minimized'
      end,
      data_minimized_at = coalesce(data_minimized_at, now()),
      closed_at = case
        when v_case.action_type = 'close_account'
             and p_auth_soft_deleted
          then now()
        else null
      end,
      erasure_case_id = p_case_id
  where user_id = v_case.target_user_id;

  update public.ideahire_privacy_requests
  set status = v_request_status,
      decision_summary = v_user_message,
      completed_at = now(),
      updated_at = now()
  where id = v_case.privacy_request_id;

  insert into public.ideahire_privacy_request_events (
    request_id,
    actor_user_id,
    actor_role,
    event_type,
    visibility,
    message
  ) values (
    v_case.privacy_request_id,
    v_admin_id,
    v_role,
    'status_changed',
    'user',
    v_user_message
  );

  insert into public.ideahire_erasure_case_events (
    case_id,
    actor_user_id,
    actor_role,
    event_type,
    visibility,
    message,
    details
  ) values (
    p_case_id,
    v_admin_id,
    v_role,
    case
      when v_final_case_status = 'completed'
        then 'completed'
      else 'failed'
    end,
    'internal',
    case
      when v_case.action_type = 'minimize_data'
        then 'Pełne usuwanie możliwych danych zakończono. Konto Auth pozostaje aktywne.'
      when v_final_case_status = 'completed'
        then 'Pełne usuwanie możliwych danych i zamknięcie konta zakończono.'
      else 'Możliwe dane zminimalizowano, ale wyłączenie dostępu Auth nie powiodło się.'
    end,
    coalesce(p_execution_result, '{}'::jsonb)
  );

  insert into public.ideahire_admin_audit_log (
    actor_user_id,
    actor_role,
    action,
    target_user_id,
    details
  ) values (
    v_admin_id,
    v_role,
    case
      when v_final_case_status = 'completed'
        then 'erasure_case_completed'
      else 'erasure_case_failed'
    end,
    v_case.target_user_id,
    jsonb_build_object(
      'privacy_request_id', v_case.privacy_request_id,
      'erasure_case_id', p_case_id,
      'action_type', v_case.action_type,
      'auth_soft_deleted', p_auth_soft_deleted,
      'account_remains_active',
        v_case.action_type = 'minimize_data',
      'scope_version', '2026-10-28',
      'failure_reason', p_failure_reason
    )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_ideahire_erasure_work_objects(p_case_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_admin uuid := auth.uid();
  v_role text;
  v_case public.ideahire_erasure_cases%rowtype;
  v_objects jsonb;
begin
  select role
  into v_role
  from public.ideahire_staff
  where user_id = v_admin
    and is_active = true;

  if v_role is null or v_role not in ('owner', 'admin') then
    raise exception using
      errcode = '42501',
      message = 'Brak uprawnień administratora.';
  end if;

  select *
  into v_case
  from public.ideahire_erasure_cases
  where id = p_case_id;

  if not found or v_case.status <> 'processing' then
    raise exception using
      errcode = 'P0001',
      message = 'Sprawa nie jest w trakcie bezpiecznego wykonania.';
  end if;

  if v_role <> 'owner'
     and v_case.execution_started_by is distinct from v_admin then
    raise exception using
      errcode = '42501',
      message = 'Operację musi kontynuować prowadzący administrator.';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'bucket_id', i.storage_bucket,
        'name', i.storage_path,
        'shared_item_id', i.id
      )
      order by i.storage_path
    ),
    '[]'::jsonb
  )
  into v_objects
  from public.ideahire_shared_items i
  where i.sender_id = v_case.target_user_id
    and i.storage_bucket = 'ideahire-private-work'
    and i.storage_path is not null
    and i.delivery_id is null
    and not exists(select 1 from public.ideahire_private_report_evidence e where e.conversation_id=i.conversation_id)
    and not exists(select 1 from public.ideahire_work_deliveries e where e.conversation_id=i.conversation_id)
    and not exists(select 1 from public.dispute_message_evidence e where e.message_id=i.message_id)
    and not exists (
      select 1
      from public.ideahire_content_reports r
      where r.conversation_id=i.conversation_id
         or r.shared_item_id = i.id
         or r.message_id = i.message_id
    )
    and not exists (
      select 1
      from public.conversation_agreements a
      where a.conversation_id = i.conversation_id
    )
    and not exists (
      select 1
      from public.ideahire_payments p
      where p.conversation_id = i.conversation_id
    )
    and not exists (
      select 1
      from public.disputes d
      where d.conversation_id = i.conversation_id
    );

  return jsonb_build_object(
    'case_id', p_case_id,
    'work_objects', v_objects
  );
end;
$function$;

REVOKE ALL ON FUNCTION public.admin_finalize_ideahire_erasure_case(uuid,boolean,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_finalize_ideahire_erasure_case(uuid,boolean,jsonb,text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_get_ideahire_erasure_work_objects(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_get_ideahire_erasure_work_objects(uuid) TO authenticated;
