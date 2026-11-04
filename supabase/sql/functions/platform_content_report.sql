-- Website intake reuses the staff report queue and its existing RLS policies.
-- No content is removed and no user is sanctioned by this function.
alter table public.ideahire_content_reports
  drop constraint if exists ideahire_content_reports_type_check;
alter table public.ideahire_content_reports add constraint ideahire_content_reports_type_check
  check (content_type in ('portfolio_album','portfolio_image','private_message','private_file','private_link','work_delivery','platform_page'));

create or replace function public.submit_ideahire_platform_content_report(
  p_location text, p_reason_code text, p_explanation text,
  p_legal_reference text, p_good_faith_confirmed boolean
) returns jsonb language plpgsql security definer set search_path = '' as $function$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_location text := btrim(coalesce(p_location,''));
  v_report public.ideahire_content_reports%rowtype;
begin
  if v_user is null then
    raise exception using errcode='42501', message='Zaloguj się, aby wysłać zgłoszenie.';
  end if;
  select email into v_email from auth.users where id=v_user;
  if v_email is null then raise exception using errcode='42501',message='Nie można potwierdzić konta zgłaszającego.'; end if;
  if char_length(v_location) not between 1 and 2000
    or v_location !~ '^https://ideahire-new[.]pages[.]dev(/[^[:space:]]*)?$' then
    raise exception using errcode='22023',message='Wskaż prawidłowy adres strony w IdeaHire.';
  end if;
  if p_reason_code is null or p_reason_code not in ('copyright','privacy_or_image_rights','impersonation','harassment_or_threats','fraud_or_scam','illegal_goods_or_services','other_terms_breach','other_illegal_content') then
    raise exception using errcode='22023',message='Wybierz powód zgłoszenia.';
  end if;
  if char_length(btrim(coalesce(p_explanation,''))) not between 50 and 5000 then
    raise exception using errcode='22023',message='Wyjaśnienie musi mieć od 50 do 5000 znaków.';
  end if;
  if char_length(btrim(coalesce(p_legal_reference,'')))>1500 then
    raise exception using errcode='22023',message='Podstawa zgłoszenia może mieć maksymalnie 1500 znaków.';
  end if;
  if p_good_faith_confirmed is distinct from true then
    raise exception using errcode='22023',message='Potwierdź oświadczenie o dobrej wierze.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ideahire-platform-report:'||v_user::text,0));
  -- A retry after a lost response returns the existing receipt without another submission.
  select * into v_report from public.ideahire_content_reports
    where reporter_user_id=v_user and content_type='platform_page'
      and content_location=v_location and status in ('submitted','in_review')
    order by submitted_at desc limit 1;
  if not found then
    if (select count(*) from public.ideahire_content_reports where reporter_user_id=v_user and submitted_at>=now()-interval '24 hours')>=30 then
      raise exception using errcode='P0001',message='Osiągnięto dzienny limit zgłoszeń. Spróbuj ponownie później.';
    end if;
    v_report.id := gen_random_uuid();
    insert into public.ideahire_content_reports (
      id,report_number,reporter_user_id,reporter_email_snapshot,content_type,
      content_location,reason_code,explanation,legal_reference,good_faith_confirmed,content_snapshot
    ) values (
      v_report.id,'TRE-'||upper(substr(replace(v_report.id::text,'-',''),1,12)),v_user,v_email,'platform_page',
      v_location,p_reason_code,btrim(p_explanation),nullif(btrim(coalesce(p_legal_reference,'')),''),true,
      jsonb_build_object('evidence_type','platform_page','content_location',v_location,'captured_at',now(),
        'source','reporter_supplied_url','capture_note','Link przekazany przez zgłaszającego. Treść wymaga ręcznej weryfikacji; kopia strony nie została pobrana.')
    ) returning * into v_report;
  end if;
  return jsonb_build_object('id',v_report.id,'report_number',v_report.report_number,'status',v_report.status,'acknowledged_at',v_report.acknowledged_at);
end $function$;
revoke all on function public.submit_ideahire_platform_content_report(text,text,text,text,boolean) from public,anon;
grant execute on function public.submit_ideahire_platform_content_report(text,text,text,text,boolean) to authenticated;
