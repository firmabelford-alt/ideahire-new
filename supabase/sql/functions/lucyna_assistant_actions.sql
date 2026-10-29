-- Preserve the live history RPC's ownership checks, revisions, retention and ACL.
-- Extend only its bounded JSON validation to retain reviewable assistant actions.
do $migration$
declare
  v_oid regprocedure := 'public.ideahire_lucyna_v2_save_thread(uuid,text,text,jsonb,integer,uuid,uuid)'::regprocedure;
  v_before text;
  v_after text;
  v_allowed text := '''kind'',''createdAt'',''catalogs''';
  v_marker text := '    if v_message ? ''catalogs'' then';
  v_validation text := $validation$
    if v_message ? 'actions' then
      if jsonb_typeof(v_message->'actions') is distinct from 'array'
        or jsonb_array_length(v_message->'actions') > 3
        or octet_length((v_message->'actions')::text) > 18000 then raise exception 'lucyna_invalid'; end if;
      for v_action in select value from jsonb_array_elements(v_message->'actions') loop
        if jsonb_typeof(v_action) is distinct from 'object' then raise exception 'lucyna_invalid'; end if;
        if v_action->>'kind' = 'navigation' then
          if coalesce(v_action->>'target','') not in ('work','messages','jobs','freelancers','services','calendar','profile','portfolio','settings','my_jobs','my_services')
            or exists(select 1 from jsonb_object_keys(v_action) k where k not in ('kind','target')) then raise exception 'lucyna_invalid'; end if;
        elsif v_action->>'kind' = 'job_draft' then
          if jsonb_typeof(v_action->'draft') is distinct from 'object'
            or exists(select 1 from jsonb_object_keys(v_action) k where k not in ('kind','draft')) then raise exception 'lucyna_invalid'; end if;
          v_draft := v_action->'draft';
          if jsonb_typeof(v_draft->'title') is distinct from 'string' or length(trim(v_draft->>'title')) not between 1 and 120
            or jsonb_typeof(v_draft->'description') is distinct from 'string' or length(trim(v_draft->>'description')) not between 1 and 4000
            or jsonb_typeof(v_draft->'expected_outcome') is distinct from 'string' or length(v_draft->>'expected_outcome') > 1000
            or coalesce(v_draft->>'category','') not in ('Strony, aplikacje i IT','Grafika, UX i 3D','Marketing i sprzedaż','Teksty i tłumaczenia','Wideo, animacja i audio','Fotografia i obróbka zdjęć','AI i automatyzacje','Dane, analizy i research','Biznes i e-commerce','Architektura, wnętrza i CAD')
            or jsonb_typeof(v_draft->'budget_negotiable') is distinct from 'boolean'
            or jsonb_typeof(v_draft->'project_deadline') is distinct from 'string'
            or (v_draft->>'project_deadline' <> '' and v_draft->>'project_deadline' !~ '^\d{4}-\d{2}-\d{2}$')
            or exists(select 1 from jsonb_object_keys(v_draft) k where k not in ('title','description','expected_outcome','category','budget','budget_negotiable','project_deadline')) then raise exception 'lucyna_invalid'; end if;
          if jsonb_typeof(v_draft->'budget') = 'number' then
            if (v_draft->>'budget')::numeric not between 1 and 10000 then raise exception 'lucyna_invalid'; end if;
          elsif jsonb_typeof(v_draft->'budget') is distinct from 'null' then raise exception 'lucyna_invalid'; end if;
        elsif v_action->>'kind' = 'fee' then
          if jsonb_typeof(v_action->'amount') is distinct from 'number'
            or jsonb_typeof(v_action->'fee') is distinct from 'number'
            or jsonb_typeof(v_action->'total') is distinct from 'number'
            or coalesce(v_action->>'currency','') <> 'PLN'
            or exists(select 1 from jsonb_object_keys(v_action) k where k not in ('kind','amount','fee','total','currency')) then raise exception 'lucyna_invalid'; end if;
          if (v_action->>'amount')::numeric not between 1 and 10000
            or (v_action->>'fee')::numeric not between 20 and 229
            or (v_action->>'total')::numeric not between 21 and 10229 then raise exception 'lucyna_invalid'; end if;
        else raise exception 'lucyna_invalid'; end if;
      end loop;
    end if;
$validation$;
begin
  select pg_get_functiondef(v_oid) into v_before;
  if position('v_action jsonb' in v_before) > 0 then raise exception 'lucyna_actions_already_installed'; end if;
  if (length(v_before)-length(replace(v_before,v_allowed,'')))/length(v_allowed) <> 1
    or (length(v_before)-length(replace(v_before,v_marker,'')))/length(v_marker) <> 1
    or position('v_message jsonb;' in v_before) = 0 then raise exception 'lucyna_history_definition_changed'; end if;
  v_after := replace(v_before,'v_message jsonb;','v_message jsonb; v_action jsonb; v_draft jsonb;');
  v_after := replace(v_after,v_allowed,v_allowed||',''actions''');
  v_after := replace(v_after,v_marker,v_validation||v_marker);
  execute v_after;
end
$migration$;
