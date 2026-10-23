-- Appeal replies, a final internal decision and verified administrator messages.
-- Existing cases, decisions, appeal deadlines and money movements are preserved.
ALTER TABLE public.dispute_decisions ADD COLUMN IF NOT EXISTS is_final boolean NOT NULL DEFAULT false;
ALTER TABLE public.dispute_appeals ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE public.dispute_appeals ADD COLUMN IF NOT EXISTS final_decision_id uuid REFERENCES public.dispute_decisions(id) ON DELETE RESTRICT;
ALTER TABLE public.dispute_statements ADD COLUMN IF NOT EXISTS appeal_id uuid REFERENCES public.dispute_appeals(id) ON DELETE RESTRICT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_role text NOT NULL DEFAULT 'user'
  CONSTRAINT messages_sender_role_check CHECK (sender_role IN ('user','admin'));
CREATE INDEX IF NOT EXISTS dispute_statements_appeal_id_idx ON public.dispute_statements(appeal_id) WHERE appeal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS dispute_appeals_final_decision_id_idx ON public.dispute_appeals(final_decision_id) WHERE final_decision_id IS NOT NULL;


CREATE OR REPLACE FUNCTION public.admin_issue_dispute_decision(p_dispute_id uuid, p_outcome text, p_rationale text, p_amount numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_admin_id uuid := auth.uid();
  v_dispute public.disputes%rowtype;
  v_role text;
  v_version integer;
  v_decision_id uuid;
  v_effective_amount numeric;
  v_previous public.dispute_decisions%rowtype;
  v_final boolean := false;
begin
  select s.role
  into v_role
  from public.ideahire_staff s
  where s.user_id = v_admin_id
    and s.is_active = true
    and s.role in (
      'owner',
      'admin'
    );

  if v_admin_id is null
  or v_role is null then
    raise exception
      'Brak aktywnych uprawnien administratora.';
  end if;

  select *
  into v_dispute
  from public.disputes
  where id = p_dispute_id
  for update;

  if not found
  or v_dispute.status in (
    'closed',
    'cancelled'
  ) then
    raise exception
      'Ta sprawa nie jest juz aktywna.';
  end if;

  if v_dispute.assigned_admin_id is not null
  and v_dispute.assigned_admin_id <> v_admin_id
  and v_role <> 'owner' then
    raise exception
      'Decyzje moze wydac administrator przypisany do sprawy.';
  end if;

  select * into v_previous from public.dispute_decisions
  where dispute_id=v_dispute.id and is_current for update;
  if v_previous.is_final then
    raise exception 'Wydano już ostateczną decyzję w wewnętrznej procedurze IdeaHire.';
  end if;
  if exists(select 1 from ideahire_finance.actions where dispute_id=v_dispute.id) then
    raise exception 'Rozliczenie Stripe zostało rozpoczęte. Nie można zmieniać tej decyzji.';
  end if;
  v_final := exists(select 1 from public.dispute_appeals ap
    where ap.decision_id=v_previous.id and ap.resolved_at is null);
  if v_final then
    if v_dispute.assigned_admin_id is distinct from v_admin_id then
      raise exception 'Odwołanie rozstrzyga administrator przypisany do sprawy. Najpierw przejmij sprawę.';
    end if;
    if v_dispute.appeal_deadline_at is null or now()<=v_dispute.appeal_deadline_at then
      raise exception 'Termin na odwołania nadal trwa. Możesz już odpowiedzieć; decyzję ostateczną wydaj po jego upływie, aby zachować czas przyznany obu stronom.';
    end if;
    if exists(select 1 from public.dispute_appeals ap where ap.decision_id=v_previous.id
      and ap.resolved_at is null and not exists(select 1 from public.dispute_statements st
        where st.appeal_id=ap.id and st.author_role in ('admin','owner') and st.visibility='parties')) then
      raise exception 'Przed decyzją ostateczną odpowiedz jawnie na każde nierozpatrzone odwołanie.';
    end if;
  end if;

  if p_outcome is null
  or p_outcome not in (
    'work_continue',
    'deadline_extension',
    'cancel_no_refund',
    'full_refund',
    'partial_refund',
    'release_payment',
    'no_action',
    'other'
  ) then
    raise exception
      'Wybierz prawidlowy wynik sprawy.';
  end if;

  if char_length(
    trim(
      coalesce(
        p_rationale,
        ''
      )
    )
  ) < 20
  or char_length(
    trim(
      coalesce(
        p_rationale,
        ''
      )
    )
  ) > 10000 then
    raise exception
      'Uzasadnienie musi miec od 20 do 10 000 znakow.';
  end if;

  if p_outcome = 'partial_refund' then
    if p_amount is null
    or p_amount <= 0
    or p_amount*100<>round(p_amount*100)
    or p_amount >= v_dispute.price_amount_snapshot then
      raise exception
        'Czesciowy zwrot musi byc wiekszy od 0 i mniejszy od ceny zlecenia.';
    end if;

    v_effective_amount := p_amount;

  elsif p_outcome in (
    'full_refund',
    'release_payment'
  ) then
    if p_amount is not null then
      raise exception
        'Kwota jest pobierana automatycznie z zaakceptowanej umowy.';
    end if;

    v_effective_amount :=
      v_dispute.price_amount_snapshot;

  else
    if p_amount is not null then
      raise exception
        'Ten rodzaj decyzji nie przyjmuje kwoty.';
    end if;

    v_effective_amount := null;
  end if;

  update public.dispute_decisions
  set is_current = false
  where dispute_id = v_dispute.id
    and is_current = true;

  select coalesce(
    max(version),
    0
  ) + 1
  into v_version
  from public.dispute_decisions
  where dispute_id = v_dispute.id;

  insert into public.dispute_decisions (
    dispute_id,
    version,
    issued_by,
    outcome,
    amount,
    rationale,
    is_current,
    is_final,
    payment_action_status
  )
  values (
    v_dispute.id,
    v_version,
    v_admin_id,
    p_outcome,
    v_effective_amount,
    trim(p_rationale),
    true,
    v_final,
    case
      when p_outcome in (
        'full_refund',
        'partial_refund',
        'release_payment'
      )
        then 'pending'
      else 'not_required'
    end
  )
  returning id into v_decision_id;

  update public.disputes
  set
    assigned_admin_id = coalesce(
      assigned_admin_id,
      v_admin_id
    ),
    status = 'decision_issued',
    appeal_deadline_at =
      case when v_final then now() else now() + interval '7 days' end,
    updated_at = now()
  where id = v_dispute.id;

  insert into public.dispute_statements (
    dispute_id,
    author_user_id,
    author_role,
    statement_type,
    visibility,
    body
  )
  values (
    v_dispute.id,
    v_admin_id,
    v_role,
    'decision',
    'parties',
    trim(p_rationale)
  );

  if v_final then
    update public.dispute_appeals set resolved_at=now(), final_decision_id=v_decision_id
    where decision_id=v_previous.id and resolved_at is null;
  end if;

  perform public.ideahire_notify_dispute(
    v_dispute.client_id,
    v_dispute.id,
    'decision',
    case when v_final then 'Wydano ostateczną decyzję po odwołaniu' else 'Wydano decyzje w sporze' end,
    'Decyzja wraz z uzasadnieniem jest dostepna w centrum sporu.'
  );

  perform public.ideahire_notify_dispute(
    v_dispute.contractor_id,
    v_dispute.id,
    'decision',
    case when v_final then 'Wydano ostateczną decyzję po odwołaniu' else 'Wydano decyzje w sporze' end,
    'Decyzja wraz z uzasadnieniem jest dostepna w centrum sporu.'
  );

  perform public.ideahire_write_audit(
    v_admin_id,
    v_role,
    case when v_final then 'appeal_final_decision_issued' else 'decision_issued' end,
    v_dispute.id,
    null,
    jsonb_build_object(
      'decision_id',
      v_decision_id,
      'version',
      v_version,
      'outcome',
      p_outcome,
      'amount',
      v_effective_amount
    )
  );

  return v_decision_id;
end;
$function$;


CREATE OR REPLACE FUNCTION public.admin_take_dispute(p_dispute_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_admin_id uuid := auth.uid();
  v_dispute public.disputes%rowtype;
  v_role text;
begin
  select s.role
  into v_role
  from public.ideahire_staff s
  where s.user_id = v_admin_id
    and s.is_active = true
    and s.role in (
      'owner',
      'admin'
    );

  if v_admin_id is null
  or v_role is null then
    raise exception
      'Brak aktywnych uprawnien administratora.';
  end if;

  select *
  into v_dispute
  from public.disputes
  where id = p_dispute_id
  for update;

  if not found
  or v_dispute.status in (
    'closed',
    'cancelled'
  ) then
    raise exception
      'Ta sprawa nie jest juz aktywna.';
  end if;

  if v_dispute.assigned_admin_id is not null
  and v_dispute.assigned_admin_id <> v_admin_id
  and v_role <> 'owner' then
    raise exception
      'Ta sprawa jest juz przypisana do innego administratora.';
  end if;

  if v_dispute.assigned_admin_id=v_admin_id then return v_dispute.id; end if;
  if exists(select 1 from ideahire_finance.actions where dispute_id=v_dispute.id and state<>'completed') then
    raise exception 'Trwa rozliczenie Stripe. Najpierw sprawdź tę operację, zanim zmienisz przypisanie.';
  end if;

  update public.disputes
  set
    assigned_admin_id = v_admin_id,
    status = case when status in ('decision_issued','appealed') then status else 'under_review' end,
    updated_at = now()
  where id = v_dispute.id;

  insert into public.dispute_statements (
    dispute_id,
    author_role,
    statement_type,
    visibility,
    body
  )
  values (
    v_dispute.id,
    'system',
    'system',
    'parties',
    'Sprawa zostala przekazana do analizy administratora.'
  );

  perform public.ideahire_notify_dispute(
    v_dispute.client_id,
    v_dispute.id,
    'review_started',
    'Rozpoczeto analize sporu',
    'Administrator rozpoczal analize sprawy.'
  );

  perform public.ideahire_notify_dispute(
    v_dispute.contractor_id,
    v_dispute.id,
    'review_started',
    'Rozpoczeto analize sporu',
    'Administrator rozpoczal analize sprawy.'
  );

  perform public.ideahire_write_audit(
    v_admin_id,
    v_role,
    'dispute_taken_for_review',
    v_dispute.id,
    null,
    '{}'::jsonb
  );

  return v_dispute.id;
end;
$function$;


CREATE OR REPLACE FUNCTION public.appeal_ideahire_dispute(p_dispute_id uuid, p_reason text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_dispute public.disputes%rowtype;
  v_decision_id uuid;
  v_appeal_id uuid;
  v_actor_role text;
  v_other_user_id uuid;
begin
  select *
  into v_dispute
  from public.disputes
  where id = p_dispute_id
  for update;

  if v_user_id is null
  or not found
  or v_user_id not in (
    v_dispute.client_id,
    v_dispute.contractor_id
  ) then
    raise exception
      'Nie masz dostepu do tego sporu.';
  end if;

  if v_dispute.status not in ('decision_issued','appealed','under_review')
  or v_dispute.appeal_deadline_at is null
  or now() > v_dispute.appeal_deadline_at then
    raise exception
      'Termin na odwolanie nie jest aktywny albo juz minal.';
  end if;

  if char_length(
    trim(
      coalesce(
        p_reason,
        ''
      )
    )
  ) < 20
  or char_length(
    trim(
      coalesce(
        p_reason,
        ''
      )
    )
  ) > 10000 then
    raise exception
      'Uzasadnienie odwolania musi miec od 20 do 10 000 znakow.';
  end if;

  select d.id
  into v_decision_id
  from public.dispute_decisions d
  where d.dispute_id = v_dispute.id
    and d.is_current = true;

  if v_decision_id is null then
    raise exception
      'Nie znaleziono aktywnej decyzji.';
  end if;

  if exists(select 1 from public.dispute_decisions d where d.id=v_decision_id and d.is_final) then
    raise exception 'To decyzja ostateczna w procedurze IdeaHire. Nie przysługuje kolejne wewnętrzne odwołanie; prawa ustawowe pozostają bez zmian.';
  end if;
  if exists(select 1 from ideahire_finance.actions where dispute_id=v_dispute.id) then
    raise exception 'Rozliczenie Stripe zostało rozpoczęte. Skontaktuj się z administratorem w sprawie tej operacji.';
  end if;

  insert into public.dispute_appeals (
    dispute_id,
    decision_id,
    appealed_by,
    reason
  )
  values (
    v_dispute.id,
    v_decision_id,
    v_user_id,
    trim(p_reason)
  )
  returning id into v_appeal_id;

  v_actor_role := case
    when v_user_id = v_dispute.client_id
      then 'client'
    else 'contractor'
  end;

  insert into public.dispute_statements (
    dispute_id,
    author_user_id,
    author_role,
    statement_type,
    visibility,
    body
  )
  values (
    v_dispute.id,
    v_user_id,
    v_actor_role,
    'appeal',
    'parties',
    trim(p_reason)
  );

  update public.disputes
  set
    status = 'appealed',
    updated_at = now()
  where id = v_dispute.id;

  v_other_user_id := case
    when v_user_id = v_dispute.client_id
      then v_dispute.contractor_id
    else v_dispute.client_id
  end;

  perform public.ideahire_notify_dispute(
    v_other_user_id,
    v_dispute.id,
    'appeal',
    'Zlozono odwolanie od decyzji',
    'Druga strona zlozyla odwolanie. Sprawa zostanie ponownie przeanalizowana.'
  );

  if v_dispute.assigned_admin_id is not null then
    perform public.ideahire_notify_dispute(
      v_dispute.assigned_admin_id,
      v_dispute.id,
      'appeal',
      'Nowe odwolanie w przypisanej sprawie',
      'Uzytkownik zlozyl odwolanie od decyzji.'
    );
  end if;

  perform public.ideahire_write_audit(
    v_user_id,
    v_actor_role,
    'appeal_submitted',
    v_dispute.id,
    null,
    jsonb_build_object(
      'appeal_id',
      v_appeal_id,
      'decision_id',
      v_decision_id
    )
  );

  return v_appeal_id;

exception
  when unique_violation then
    raise exception
      'Ta osoba wykorzystala juz swoje odwolanie w tej sprawie.';
end;
$function$;


CREATE OR REPLACE FUNCTION public.respond_to_dispute_appeal(p_appeal_id uuid,p_body text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE actor uuid:=auth.uid(); ap public.dispute_appeals%rowtype; s public.disputes%rowtype;
  role_name text; result uuid; body_text text:=btrim(coalesce(p_body,''));
BEGIN
  if actor is null then raise exception 'Zaloguj się ponownie.' using errcode='42501'; end if;
  select * into ap from public.dispute_appeals where id=p_appeal_id;
  if not found then raise exception 'Nie znaleziono odwołania.'; end if;
  select * into s from public.disputes where id=ap.dispute_id for update;
  select st.role into role_name from public.ideahire_staff st where st.user_id=actor and st.is_active and st.role in ('owner','admin');
  if role_name is not null then
    if s.assigned_admin_id is distinct from actor then raise exception 'Najpierw przejmij tę sprawę.' using errcode='42501'; end if;
  elsif actor=s.client_id then role_name:='client';
  elsif actor=s.contractor_id then role_name:='contractor';
  else raise exception 'Nie masz dostępu do tego odwołania.' using errcode='42501'; end if;
  if char_length(body_text) not between 3 and 10000 then raise exception 'Odpowiedź musi mieć od 3 do 10 000 znaków.'; end if;
  if s.status not in ('appealed','under_review') or ap.resolved_at is not null
    or not exists(select 1 from public.dispute_decisions d where d.id=ap.decision_id and d.is_current and not d.is_final)
    or exists(select 1 from ideahire_finance.actions a where a.dispute_id=s.id) then
    raise exception 'Odwołanie nie jest już otwarte do odpowiedzi.';
  end if;
  insert into public.dispute_statements(dispute_id,appeal_id,author_user_id,author_role,statement_type,visibility,body)
    values(s.id,ap.id,actor,role_name,'response','parties',body_text) returning id into result;
  if actor<>s.client_id then perform public.ideahire_notify_dispute(s.client_id,s.id,'appeal','Nowa odpowiedź na odwołanie','Odpowiedź jest dostępna w szczegółach odwołania.'); end if;
  if actor<>s.contractor_id then perform public.ideahire_notify_dispute(s.contractor_id,s.id,'appeal','Nowa odpowiedź na odwołanie','Odpowiedź jest dostępna w szczegółach odwołania.'); end if;
  if s.assigned_admin_id is not null and actor<>s.assigned_admin_id then
    perform public.ideahire_notify_dispute(s.assigned_admin_id,s.id,'appeal','Odpowiedź na odwołanie w przypisanej sprawie','Sprawdź odpowiedź przed wydaniem ostatecznej decyzji.');
  end if;
  perform public.ideahire_write_audit(actor,role_name,'dispute_appeal_response_added',s.id,null,jsonb_build_object('appeal_id',ap.id,'statement_id',result));
  return result;
END $function$;
REVOKE ALL ON FUNCTION public.respond_to_dispute_appeal(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_dispute_appeal(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.ideahire_validate_message_sender_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
BEGIN
  if tg_op='UPDATE' then
    if new.sender_role is distinct from old.sender_role or (old.sender_role='admin' and (
      new.sender_id is distinct from old.sender_id or new.conversation_id is distinct from old.conversation_id
      or new.content is distinct from old.content or new.created_at is distinct from old.created_at)) then
      raise exception 'Nie można zmieniać autora ani treści zapisanej wiadomości administratora.';
    end if;
    return new;
  end if;
  if new.sender_role='admin' then
    if auth.uid() is null or new.sender_id is distinct from auth.uid() or not exists(
      select 1 from public.disputes d join public.ideahire_staff st on st.user_id=d.assigned_admin_id
      where d.conversation_id=new.conversation_id and d.assigned_admin_id=auth.uid()
      and d.status not in ('closed','cancelled') and st.is_active and st.role in ('owner','admin')) then
      raise exception 'Wiadomość administracyjną może wysłać tylko aktywny administrator przypisany do tej sprawy.' using errcode='42501';
    end if;
    new.created_at:=now(); new.read_at:=null;
    new.moderation_status:='active'; new.hidden_at:=null; new.hidden_by:=null;
  end if;
  return new;
END $function$;
REVOKE ALL ON FUNCTION public.ideahire_validate_message_sender_role() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS ideahire_validate_message_sender_role_trigger ON public.messages;
CREATE TRIGGER ideahire_validate_message_sender_role_trigger BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.ideahire_validate_message_sender_role();


CREATE OR REPLACE FUNCTION public.ideahire_block_staff_user_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
  -- A narrowly scoped exception; staff still cannot act as marketplace users.
  if tg_table_schema='public' and tg_table_name='messages' and tg_op='INSERT' then
    if new.sender_role='admin' and new.sender_id=auth.uid() and exists(
      select 1 from public.disputes d join public.ideahire_staff st on st.user_id=d.assigned_admin_id
      where d.conversation_id=new.conversation_id and d.assigned_admin_id=auth.uid()
        and d.status not in ('closed','cancelled') and st.is_active and st.role in ('owner','admin')) then
      return new;
    end if;
  end if;
  if current_setting(
       'app.ideahire_erasure_operation',
       true
     ) = 'on' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if auth.uid() is not null
     and public.is_ideahire_staff(
       auth.uid(),
       array['owner', 'admin']::text[]
     ) then
    raise exception using
      errcode = 'P0001',
      message = 'Konto administracyjne działa w trybie tylko do obsługi IdeaHire.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;


CREATE OR REPLACE FUNCTION public.admin_send_dispute_chat_message(p_dispute_id uuid,p_content text,p_message_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $function$
DECLARE actor uuid:=auth.uid(); s public.disputes%rowtype; role_name text;
  body_text text:=btrim(coalesce(p_content,'')); prior public.messages%rowtype;
BEGIN
  select st.role into role_name from public.ideahire_staff st where st.user_id=actor and st.is_active and st.role in ('owner','admin');
  if actor is null or role_name is null then raise exception 'Brak uprawnień administratora.' using errcode='42501'; end if;
  select * into s from public.disputes where id=p_dispute_id for update;
  if not found or s.assigned_admin_id is distinct from actor then
    raise exception 'Możesz pisać wyłącznie na czacie przypisanego Ci sporu.' using errcode='42501';
  end if;
  if char_length(body_text) not between 1 and 10000 or p_message_id is null then
    raise exception 'Wpisz wiadomość od 1 do 10 000 znaków.';
  end if;
  select * into prior from public.messages where id=p_message_id;
  if found then
    if prior.conversation_id=s.conversation_id and prior.sender_id=actor and prior.sender_role='admin' and prior.content=body_text then return prior.id; end if;
    raise exception 'Identyfikator tej wiadomości jest już używany.';
  end if;
  if s.status in ('closed','cancelled') then raise exception 'Czat administracyjny tej sprawy jest zamknięty.'; end if;
  insert into public.messages(id,conversation_id,sender_id,content,sender_role)
    values(p_message_id,s.conversation_id,actor,body_text,'admin');
  perform public.ideahire_write_audit(actor,role_name,'admin_dispute_chat_message_sent',s.id,null,jsonb_build_object('message_id',p_message_id));
  perform public.ideahire_notify_dispute(s.client_id,s.id,'response','Administrator napisał na czacie sprawy','Wiadomość jest dostępna w rozmowie dotyczącej zlecenia.');
  perform public.ideahire_notify_dispute(s.contractor_id,s.id,'response','Administrator napisał na czacie sprawy','Wiadomość jest dostępna w rozmowie dotyczącej zlecenia.');
  return p_message_id;
END $function$;
REVOKE ALL ON FUNCTION public.admin_send_dispute_chat_message(uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_send_dispute_chat_message(uuid,text,uuid) TO authenticated;

