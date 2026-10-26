-- IdeaHire: odpowiedź na ustalenia i rezygnacja przed rozpoczęciem pracy.
-- Uruchom cały plik w SQL Editor projektu Supabase używanego przez stronę.
-- Wymaga istniejących tabel ustaleń, płatności i usług. Migracja addytywna.
-- Nie anuluje płatności ani zaakceptowanej/rozpoczętej współpracy.
begin;

alter table public.conversation_agreements
  add column if not exists response_action text check (response_action in ('changes', 'closed')),
  add column if not exists response_by uuid references auth.users(id) on delete set null,
  add column if not exists response_reason text not null default '' check (char_length(response_reason) <= 1200),
  add column if not exists responded_at timestamptz,
  add column if not exists response_message_id uuid references public.messages(id) on delete set null;

alter table public.conversations
  add column if not exists negotiation_closed_at timestamptz,
  add column if not exists negotiation_closed_by uuid references auth.users(id) on delete set null;

-- Pierwszą propozycję przygotowuje klient także po zapytaniu o usługę.
-- Trigger obejmuje istniejące create_service_inquiry bez nadpisywania jego
-- walidacji, polityk dostępu ani obsługi utworzonych zapytań.
create or replace function public.ideahire_service_client_first()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.first_proposer_role := 'client';
  return new;
end;
$$;
drop trigger if exists service_client_first on public.conversations;
create trigger service_client_first before insert on public.conversations
for each row when (new.origin_type = 'service_inquiry')
execute function public.ideahire_service_client_first();

update public.conversations c set first_proposer_role = 'client'
where c.origin_type = 'service_inquiry' and c.first_proposer_role <> 'client'
  and not exists (select 1 from public.conversation_agreements a where a.conversation_id = c.id);

-- Stary trigger wymagał wykonawcy i kolidował z regułą klienta w RPC v2.
-- Jego kontrolę zastępuje poniżej guard_pending_agreement dla obu źródeł.
drop trigger if exists service_first_offer_guard on public.conversation_agreements;

create or replace function public.ideahire_service_inquiry_intro()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_previous text := 'To niewiążące zapytanie. Oczekuję na ofertę wykonawcy z zakresem, terminem i ceną.';
begin
  if new.content like 'Zapytanie o usługę:%'
    and right(new.content, char_length(v_previous)) = v_previous
    and exists (select 1 from public.conversations c
      where c.id = new.conversation_id and c.origin_type = 'service_inquiry'
        and c.first_proposer_role = 'client' and c.client_id = new.sender_id
        and not exists (select 1 from public.messages m where m.conversation_id = c.id)) then
    new.content := left(new.content, char_length(new.content) - char_length(v_previous))
      || 'To niewiążące zapytanie. Zleceniodawca przygotowuje pierwszą propozycję ustaleń. Wykonawca może ją zaakceptować, poprosić o zmiany albo zaproponować własne warunki.';
  end if;
  return new;
end;
$$;
drop trigger if exists service_inquiry_intro on public.messages;
create trigger service_inquiry_intro before insert on public.messages
for each row execute function public.ideahire_service_inquiry_intro();

-- Wspólna blokada rozmowy serializuje nowe wersje, akceptację i odpowiedzi.
-- Chroni także istniejące RPC v2 i wywołania ze starszej wersji strony.
create or replace function public.ideahire_guard_pending_agreement()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_conversation public.conversations%rowtype;
  v_previous public.conversation_agreements%rowtype;
begin
  select * into v_conversation
  from public.conversations where id = new.conversation_id for update;

  if not found then
    raise exception 'Nie znaleziono rozmowy.' using errcode = '23503';
  end if;
  if v_conversation.negotiation_closed_at is not null then
    raise exception 'Ta współpraca została porzucona. Ustalenia pozostają w historii.' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if (new.client_accepted_at is distinct from old.client_accepted_at
      or new.contractor_accepted_at is distinct from old.contractor_accepted_at
      or (new.status = 'accepted' and old.status <> 'accepted'))
      and old.response_action is not null then
      raise exception 'Ta propozycja wymaga nowej wersji. Nie można jej już zaakceptować.' using errcode = '23514';
    end if;
    return new;
  end if;

  if new.created_by is distinct from v_conversation.client_id
    and new.created_by is distinct from v_conversation.contractor_id then
    raise exception 'Nie masz dostępu do tych ustaleń.' using errcode = '42501';
  end if;
  if exists (select 1 from public.conversation_agreements
    where conversation_id = new.conversation_id and status = 'accepted') then
    raise exception 'Zaakceptowane warunki są zablokowane.' using errcode = '23514';
  end if;

  select * into v_previous from public.conversation_agreements
  where conversation_id = new.conversation_id order by version desc limit 1 for update;
  if found then
    if new.version <= v_previous.version then
      raise exception 'Pojawiła się nowsza wersja ustaleń.' using errcode = '23514';
    end if;
    if v_previous.created_by = new.created_by and v_previous.response_action is distinct from 'changes' then
      raise exception 'Propozycja czeka na odpowiedź drugiej strony. Edycja będzie dostępna po prośbie o zmiany.' using errcode = '23514';
    end if;
  elsif new.created_by is distinct from (case
      when v_conversation.first_proposer_role = 'contractor' then v_conversation.contractor_id
      else v_conversation.client_id end) then
    raise exception 'Pierwszą propozycję przygotowuje wyznaczona strona rozmowy.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_pending_agreement on public.conversation_agreements;
create trigger guard_pending_agreement
before insert or update of status, client_accepted_at, contractor_accepted_at
on public.conversation_agreements for each row
execute function public.ideahire_guard_pending_agreement();

create or replace function public.respond_to_conversation_agreement(
  p_agreement_id uuid,
  p_action text,
  p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation_id uuid;
  v_conversation public.conversations%rowtype;
  v_agreement public.conversation_agreements%rowtype;
  v_inquiry public.service_inquiries%rowtype;
  v_message public.messages%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_service_id uuid;
  v_released integer := 0;
  v_when timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Musisz być zalogowany.' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('changes', 'closed') then
    raise exception 'Nieprawidłowa odpowiedź na propozycję.' using errcode = '23514';
  end if;
  if char_length(v_reason) > 1200 or (p_action = 'changes' and char_length(v_reason) < 3) then
    raise exception 'Opisz wymagane zmiany.' using errcode = '23514';
  end if;
  if p_action = 'closed' and v_reason = '' then
    v_reason := 'Nie zdecydowano się na współpracę na zaproponowanych warunkach.';
  end if;

  select a.conversation_id into v_conversation_id
  from public.conversation_agreements a
  join public.conversations c on c.id = a.conversation_id
  where a.id = p_agreement_id and v_user_id in (c.client_id, c.contractor_id);
  if not found then
    raise exception 'Nie masz dostępu do tych ustaleń.' using errcode = '42501';
  end if;

  select * into v_conversation from public.conversations
  where id = v_conversation_id for update;
  select * into v_agreement from public.conversation_agreements
  where conversation_id = v_conversation_id order by version desc limit 1 for update;
  if v_agreement.id is distinct from p_agreement_id then
    raise exception 'Pojawiła się nowsza propozycja. Przeczytaj aktualne ustalenia.' using errcode = '23514';
  end if;

  -- Ponowienie tego samego żądania nie duplikuje wiadomości ani zwolnienia miejsca.
  if v_agreement.response_action = p_action then
    if p_action = 'closed' or v_agreement.response_by = v_user_id then
      select * into v_message from public.messages where id = v_agreement.response_message_id;
      return jsonb_build_object('agreement', to_jsonb(v_agreement), 'message', to_jsonb(v_message),
        'service_id', null, 'released_slots', 0, 'changed', false);
    end if;
  end if;
  if v_conversation.negotiation_closed_at is not null or v_agreement.response_action = 'closed' then
    raise exception 'Ta współpraca została już porzucona.' using errcode = '23514';
  end if;
  if v_agreement.status <> 'proposed' or exists (
    select 1 from public.conversation_agreements
    where conversation_id = v_conversation_id and status = 'accepted'
  ) then
    raise exception 'Zaakceptowanej współpracy nie można porzucić w negocjacjach.' using errcode = '23514';
  end if;
  if p_action = 'changes' and v_agreement.created_by = v_user_id then
    raise exception 'Poczekaj na odpowiedź drugiej strony.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.user_blocks
    where (blocker_id = v_conversation.client_id and blocked_id = v_conversation.contractor_id)
       or (blocker_id = v_conversation.contractor_id and blocked_id = v_conversation.client_id)
  ) then
    raise exception 'Ustalenia są wstrzymane z powodu blokady użytkownika.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.ideahire_payments p
    join public.conversation_agreements a on a.id = p.agreement_id
    where a.conversation_id = v_conversation_id and p.status not in ('failed', 'cancelled')
  ) then
    raise exception 'Ta współpraca ma rozpoczęte rozliczenie. Sprawdź zakładkę Płatność.' using errcode = '23514';
  end if;

  if p_action = 'closed' then
    if v_conversation.origin_type = 'service_inquiry' then
      select * into v_inquiry from public.service_inquiries
      where id = v_conversation.origin_id and conversation_id = v_conversation_id for update;
      if not found then
        raise exception 'Nie udało się potwierdzić rezerwacji usługi. Odśwież ustalenia.' using errcode = '23514';
      end if;
      v_service_id := v_inquiry.service_id;
      perform 1 from public.freelancer_services where id = v_service_id for update;
      perform 1 from public.service_reservations where inquiry_id = v_inquiry.id for update;
      if v_inquiry.status in ('active', 'completed') or exists (
        select 1 from public.service_reservations
        where inquiry_id = v_inquiry.id and status in ('active', 'completed')
      ) then
        raise exception 'Realizacja już się rozpoczęła. Sprawdź zakładkę Płatność.' using errcode = '23514';
      end if;
      update public.service_reservations set status = 'released', reserved_until = null, updated_at = v_when
      where inquiry_id = v_inquiry.id and status = 'held';
      get diagnostics v_released = row_count;
      update public.service_inquiries set status = 'declined', updated_at = v_when
      where id = v_inquiry.id and status in ('new', 'negotiating', 'offer_sent');
    end if;
    update public.conversations set negotiation_closed_at = v_when, negotiation_closed_by = v_user_id
    where id = v_conversation_id;
  end if;

  insert into public.messages (conversation_id, sender_id, content)
  values (v_conversation_id, v_user_id,
    case when p_action = 'closed' then 'Rezygnacja ze współpracy' else 'Prośba o zmianę ustaleń' end
    || ' — wersja ' || v_agreement.version || E'.\n' || v_reason
    || E'\n\n[IdeaHire:terms:v1]' || jsonb_build_object(
      'agreementId', v_agreement.id, 'version', v_agreement.version,
      'action', p_action, 'reason', v_reason
    )::text)
  returning * into v_message;

  update public.conversation_agreements
  set response_action = p_action, response_by = v_user_id, response_reason = v_reason,
      responded_at = v_when, response_message_id = v_message.id
  where id = v_agreement.id returning * into v_agreement;

  return jsonb_build_object('agreement', to_jsonb(v_agreement), 'message', to_jsonb(v_message),
    'service_id', v_service_id, 'released_slots', v_released, 'changed', true);
end;
$$;

revoke all on function public.ideahire_guard_pending_agreement() from public;
revoke all on function public.ideahire_service_client_first() from public;
revoke all on function public.ideahire_service_inquiry_intro() from public;
revoke all on function public.respond_to_conversation_agreement(uuid, text, text) from public, anon;
grant execute on function public.respond_to_conversation_agreement(uuid, text, text) to authenticated;
-- Bezpośrednia podmiana odpowiedzi lub treści nadal jest niedostępna klientowi.
revoke insert, update, delete on public.conversation_agreements from anon, authenticated;

commit;
notify pgrst, 'reload schema';

-- Oczekiwany wynik po uruchomieniu: pięć wierszy z ready = true.
select 'response_rpc' as check_name,
  to_regprocedure('public.respond_to_conversation_agreement(uuid,text,text)') is not null as ready
union all
select 'pending_proposal_guard', exists (
  select 1 from pg_trigger where tgrelid = 'public.conversation_agreements'::regclass
    and tgname = 'guard_pending_agreement' and tgenabled in ('O','A')
)
union all
select 'service_client_first', exists (
  select 1 from pg_trigger where tgrelid = 'public.conversations'::regclass
    and tgname = 'service_client_first' and tgenabled in ('O','A')
) and not exists (
  select 1 from public.conversations c where c.origin_type = 'service_inquiry'
    and c.first_proposer_role <> 'client'
    and not exists (select 1 from public.conversation_agreements a where a.conversation_id = c.id)
)
union all
select 'inquiry_message_intro', exists (
  select 1 from pg_trigger where tgrelid = 'public.messages'::regclass
    and tgname = 'service_inquiry_intro' and tgenabled in ('O','A')
)
union all
select 'authenticated_rpc_only',
  has_function_privilege('authenticated', 'public.respond_to_conversation_agreement(uuid,text,text)', 'execute')
  and not has_function_privilege('anon', 'public.respond_to_conversation_agreement(uuid,text,text)', 'execute');
