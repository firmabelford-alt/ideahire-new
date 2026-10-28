-- Registration consent history. Apply as one migration before the UI update.
-- No existing user, legal acceptance, payment or profile is changed.
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create schema ideahire_registration;
revoke all on schema ideahire_registration from public, anon, authenticated, service_role;
grant usage on schema ideahire_registration to supabase_auth_admin;

create table ideahire_registration.consent_notices (
  version text primary key,
  content jsonb not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  registered_at timestamptz not null default clock_timestamp()
);
alter table ideahire_registration.consent_notices enable row level security;
revoke all on ideahire_registration.consent_notices from public, anon, authenticated, service_role;

with notice as (
  select '2026-10-28-v1'::text as version, jsonb_build_object(
    'purpose', 'Optional private account details to help prepare future work; not identity verification or tax classification.',
    'fields', jsonb_build_array('full_name', 'account_use', 'organization_name'),
    'consent_pl', 'Zgadzam się na zapis tych opcjonalnych danych na koncie, aby ułatwić przygotowanie przyszłej współpracy. Zgodę mogę wycofać, usuwając te dane w ustawieniach konta.',
    'consent_en', 'I consent to saving these optional details in my account to help prepare future work. I can withdraw consent by deleting these details in account settings.'
  ) as content
)
insert into ideahire_registration.consent_notices (version, content, sha256)
select version, content, encode(sha256(convert_to(content::text, 'UTF8')), 'hex') from notice;

create table public.ideahire_registration_consent_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('granted', 'details_updated', 'withdrawn', 'observed')),
  notice_version text not null references ideahire_registration.consent_notices(version),
  notice_sha256 text not null check (notice_sha256 ~ '^[0-9a-f]{64}$'),
  provided_fields text[] not null check (provided_fields <@ array['full_name', 'account_use', 'organization_name']::text[]),
  source text not null check (source in ('signup', 'auth_update', 'data_removed', 'deployment_observation')),
  recorded_at timestamptz not null default clock_timestamp()
);
comment on table public.ideahire_registration_consent_events is
  'Server-recorded evidence of optional work-details consent. Contains field names, not their values. API clients can only read their own history.';
create index ideahire_registration_consent_user_time_idx
  on public.ideahire_registration_consent_events (user_id, recorded_at desc, id desc);
alter table public.ideahire_registration_consent_events enable row level security;
revoke all on public.ideahire_registration_consent_events from public, anon, authenticated, service_role;
revoke all on sequence public.ideahire_registration_consent_events_id_seq from public, anon, authenticated, service_role;
grant select on public.ideahire_registration_consent_events to authenticated, service_role;
create policy ideahire_registration_consent_read_own
  on public.ideahire_registration_consent_events for select to authenticated
  using (user_id = (select auth.uid()));

create function ideahire_registration.capture_consent_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $function$
declare
  v_old jsonb;
  v_new jsonb := new.raw_user_meta_data -> 'private_registration_details';
  v_old_active boolean := false;
  v_new_active boolean := false;
  v_notice_version text;
  v_notice_sha256 text;
  v_fields text[];
  v_event_type text;
begin
  if tg_op = 'UPDATE' then
    v_old := old.raw_user_meta_data -> 'private_registration_details';
    if v_old is not distinct from v_new then return new; end if;
  end if;

  if v_new is not null and v_new <> 'null'::jsonb then
    if jsonb_typeof(v_new) is distinct from 'object'
      or v_new -> 'schema_version' is distinct from '1'::jsonb
      or v_new #> '{consent,granted}' is distinct from 'true'::jsonb then
      raise exception using errcode = 'P0001', message = 'Opcjonalne dane wymagają odrębnej zgody. Odśwież formularz lub pozostaw te pola puste.';
    end if;
    if (v_new -> 'full_name' is not null and v_new -> 'full_name' <> 'null'::jsonb
          and (jsonb_typeof(v_new -> 'full_name') <> 'string' or length(v_new ->> 'full_name') > 160))
      or (v_new -> 'organization_name' is not null and v_new -> 'organization_name' <> 'null'::jsonb
          and (jsonb_typeof(v_new -> 'organization_name') <> 'string' or length(v_new ->> 'organization_name') > 200))
      or (v_new -> 'account_use' is not null and v_new -> 'account_use' <> 'null'::jsonb
          and (jsonb_typeof(v_new -> 'account_use') <> 'string'
            or v_new ->> 'account_use' not in ('personal', 'self_employed', 'organization'))) then
      raise exception using errcode = 'P0001', message = 'Sprawdź format opcjonalnych danych do współpracy.';
    end if;
    select n.version, n.sha256 into v_notice_version, v_notice_sha256
      from ideahire_registration.consent_notices n
      where n.version = v_new #>> '{consent,notice_version}';
    if not found then
      raise exception using errcode = 'P0001', message = 'Odśwież formularz i sprawdź informację o dobrowolnych danych.';
    end if;
    v_new_active := nullif(btrim(v_new ->> 'full_name'), '') is not null
      or nullif(btrim(v_new ->> 'account_use'), '') is not null
      or nullif(btrim(v_new ->> 'organization_name'), '') is not null;
  end if;

  v_old_active := coalesce(v_old -> 'schema_version' = '1'::jsonb
    and v_old #> '{consent,granted}' = 'true'::jsonb
    and (nullif(btrim(v_old ->> 'full_name'), '') is not null
      or nullif(btrim(v_old ->> 'account_use'), '') is not null
      or nullif(btrim(v_old ->> 'organization_name'), '') is not null), false);
  if not v_new_active and not v_old_active then return new; end if;

  if v_new_active then
    v_event_type := case when v_old_active then 'details_updated' else 'granted' end;
    select coalesce(array_agg(k order by k), array[]::text[]) into v_fields
      from unnest(array['full_name', 'account_use', 'organization_name']::text[]) as f(k)
      where nullif(btrim(v_new ->> k), '') is not null;
  else
    v_event_type := 'withdrawn';
    select n.version, n.sha256 into v_notice_version, v_notice_sha256
      from ideahire_registration.consent_notices n
      where n.version = v_old #>> '{consent,notice_version}';
    -- An unknown historical declaration is not rewritten as a known consent.
    if not found then return new; end if;
    select coalesce(array_agg(k order by k), array[]::text[]) into v_fields
      from unnest(array['full_name', 'account_use', 'organization_name']::text[]) as f(k)
      where nullif(btrim(v_old ->> k), '') is not null;
  end if;

  insert into public.ideahire_registration_consent_events
    (user_id, event_type, notice_version, notice_sha256, provided_fields, source)
  values (new.id, v_event_type, v_notice_version, v_notice_sha256, v_fields,
    case when tg_op = 'INSERT' then 'signup'
      when v_new_active then 'auth_update' else 'data_removed' end);
  return new;
end;
$function$;
revoke all on function ideahire_registration.capture_consent_event() from public, anon, authenticated, service_role;
grant execute on function ideahire_registration.capture_consent_event() to supabase_auth_admin;

create trigger ideahire_registration_capture_insert
  after insert on auth.users for each row
  when (new.raw_user_meta_data -> 'private_registration_details' is not null)
  execute function ideahire_registration.capture_consent_event();
create trigger ideahire_registration_capture_update
  after update of raw_user_meta_data on auth.users for each row
  when ((old.raw_user_meta_data -> 'private_registration_details')
    is distinct from (new.raw_user_meta_data -> 'private_registration_details'))
  execute function ideahire_registration.capture_consent_event();

-- Record only the state observed at deployment; never invent past grant times.
insert into public.ideahire_registration_consent_events
  (user_id, event_type, notice_version, notice_sha256, provided_fields, source)
select u.id, 'observed', n.version, n.sha256,
  array(select k from unnest(array['full_name', 'account_use', 'organization_name']::text[]) as f(k)
    where nullif(btrim(u.raw_user_meta_data -> 'private_registration_details' ->> k), '') is not null order by k),
  'deployment_observation'
from auth.users u
join ideahire_registration.consent_notices n
  on n.version = u.raw_user_meta_data #>> '{private_registration_details,consent,notice_version}'
where u.raw_user_meta_data #> '{private_registration_details,schema_version}' = '1'::jsonb
  and u.raw_user_meta_data #> '{private_registration_details,consent,granted}' = 'true'::jsonb
  and (nullif(btrim(u.raw_user_meta_data #>> '{private_registration_details,full_name}'), '') is not null
    or nullif(btrim(u.raw_user_meta_data #>> '{private_registration_details,account_use}'), '') is not null
    or nullif(btrim(u.raw_user_meta_data #>> '{private_registration_details,organization_name}'), '') is not null);
