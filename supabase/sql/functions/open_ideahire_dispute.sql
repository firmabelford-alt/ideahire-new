-- Canonical definition for the existing dispute RPC.
-- CREATE OR REPLACE retains its current owner and EXECUTE permissions.
-- Preserve the agreement-based window and the full review period after delivery.
CREATE OR REPLACE FUNCTION public.open_ideahire_dispute(p_agreement_id uuid, p_reason text, p_description text, p_requested_outcome text, p_requested_amount numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_agreement public.conversation_agreements%rowtype;
  v_conversation public.conversations%rowtype;
  v_job public.jobs%rowtype;
  v_dispute public.disputes%rowtype;
  v_other_user_id uuid;
  v_actor_role text;
  v_operational_deadline timestamptz;
begin
  if v_user_id is null then
    raise exception 'Musisz byc zalogowany.';
  end if;

  select *
  into v_agreement
  from public.conversation_agreements
  where id = p_agreement_id
  for update;

  if not found
  or v_agreement.status <> 'accepted' then
    raise exception
      'Spor mozna otworzyc tylko dla zaakceptowanych warunkow wspolpracy.';
  end if;

  select *
  into v_conversation
  from public.conversations
  where id = v_agreement.conversation_id;

  if not found
  or v_user_id not in (
    v_conversation.client_id,
    v_conversation.contractor_id
  ) then
    raise exception
      'Nie masz dostepu do tej umowy.';
  end if;

  select *
  into v_job
  from public.jobs
  where id = v_conversation.job_id;

  if not found then
    raise exception
      'Nie znaleziono zlecenia przypisanego do tej umowy.';
  end if;

  if v_agreement.price_amount <= 0
  or v_agreement.price_amount > 15000
  or v_agreement.price_currency <> 'PLN' then
    raise exception
      'Umowa nie ma prawidlowej ceny w PLN.';
  end if;

  v_operational_deadline := (
    greatest(
      v_agreement.deadline,
      coalesce(
        v_agreement.accepted_at::date,
        current_date
      )
    ) + 8
  )::timestamp at time zone 'Europe/Warsaw';

  -- Preserve at least the full review period after each formal delivery.
  -- A later agreement-based deadline remains available.
  select greatest(
    v_operational_deadline,
    max(delivery.submitted_at + interval '10 days')
  )
  into v_operational_deadline
  from public.ideahire_work_deliveries delivery
  where delivery.agreement_id = v_agreement.id
    and delivery.conversation_id = v_conversation.id;

  if now() >= v_operational_deadline then
    raise exception
      'Standardowe okno otwarcia sporu minelo. Skontaktuj sie z obsluga IdeaHire.';
  end if;

  if exists (
    select 1
    from public.disputes d
    where d.agreement_id = p_agreement_id
      and d.status not in (
        'closed',
        'cancelled'
      )
  ) then
    raise exception
      'Dla tej umowy istnieje juz aktywny spor.';
  end if;

  if p_reason is null
  or p_reason not in (
    'work_not_delivered',
    'work_incomplete',
    'quality_issue',
    'deadline_missed',
    'requirements_dispute',
    'communication_problem',
    'cancellation',
    'payment_issue',
    'other'
  ) then
    raise exception
      'Wybierz prawidlowy powod sporu.';
  end if;

  if p_requested_outcome is null
  or p_requested_outcome not in (
    'complete_or_correct_work',
    'extend_deadline',
    'cancel_cooperation',
    'full_refund',
    'partial_refund',
    'release_payment',
    'other'
  ) then
    raise exception
      'Wybierz prawidlowe oczekiwane rozwiazanie.';
  end if;

  if char_length(
    trim(
      coalesce(
        p_description,
        ''
      )
    )
  ) < 20
  or char_length(
    trim(
      coalesce(
        p_description,
        ''
      )
    )
  ) > 10000 then
    raise exception
      'Opis sporu musi miec od 20 do 10 000 znakow.';
  end if;

  if p_requested_outcome = 'partial_refund' then
    if p_requested_amount is null
    or p_requested_amount <= 0
    or p_requested_amount >= v_agreement.price_amount then
      raise exception
        'Kwota czesciowego zwrotu musi byc wieksza od 0 i mniejsza od ceny zlecenia.';
    end if;
  elsif p_requested_amount is not null then
    raise exception
      'Kwote podaje sie tylko przy czesciowym zwrocie.';
  end if;

  v_other_user_id := case
    when v_user_id = v_conversation.client_id
      then v_conversation.contractor_id
    else v_conversation.client_id
  end;

  v_actor_role := case
    when v_user_id = v_conversation.client_id
      then 'client'
    else 'contractor'
  end;

  insert into public.disputes (
    agreement_id,
    conversation_id,
    job_id,
    client_id,
    contractor_id,
    opened_by,
    reason,
    requested_outcome,
    requested_amount,
    opening_description,
    agreement_version,
    job_title_snapshot,
    price_amount_snapshot,
    price_currency_snapshot,
    deadline_snapshot,
    response_deadline_at,
    operational_deadline_at
  )
  values (
    v_agreement.id,
    v_conversation.id,
    v_job.id,
    v_conversation.client_id,
    v_conversation.contractor_id,
    v_user_id,
    p_reason,
    p_requested_outcome,
    p_requested_amount,
    trim(p_description),
    v_agreement.version,
    coalesce(
      nullif(
        trim(v_job.title),
        ''
      ),
      'Zlecenie'
    ),
    v_agreement.price_amount,
    v_agreement.price_currency,
    v_agreement.deadline,
    now() + interval '48 hours',
    v_operational_deadline
  )
  returning * into v_dispute;

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
    'opening',
    'parties',
    trim(p_description)
  );

  perform public.ideahire_notify_dispute(
    v_other_user_id,
    v_dispute.id,
    'opened',
    'Otwarto spor dotyczacy zlecenia',
    'Druga strona otworzyla spor. Masz 48 godzin na pierwsza odpowiedz.'
  );

  perform public.ideahire_write_audit(
    v_user_id,
    v_actor_role,
    'dispute_opened',
    v_dispute.id,
    null,
    jsonb_build_object(
      'reason',
      p_reason,
      'requested_outcome',
      p_requested_outcome,
      'agreement_version',
      v_agreement.version
    )
  );

  return v_dispute.id;
end;
$function$;
