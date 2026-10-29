-- Extend continuous Lucyna conversations and validate the two AI message proposals.
-- Preserve ownership, revisions, source access, retention and all existing byte caps.
DO $migration$
DECLARE
  v_before text;
  v_after text;
BEGIN
  v_before := pg_get_functiondef('public.ideahire_lucyna_v2_save_thread(uuid,text,text,jsonb,integer,uuid,uuid)'::regprocedure);
  IF position('v_variant jsonb;' in v_before) > 0 THEN
    RAISE NOTICE 'Lucyna conversation tools already installed';
    RETURN;
  END IF;
  v_after := v_before;
  IF position($old$jsonb_array_length(p_messages) > 40$old$ in v_after) = 0 THEN RAISE EXCEPTION 'Unexpected Lucyna function definition'; END IF;
  v_after := replace(v_after, $old$jsonb_array_length(p_messages) > 40$old$, $new$jsonb_array_length(p_messages) > 200$new$);
  IF position($old$v_message jsonb; v_action jsonb;$old$ in v_after) = 0 THEN RAISE EXCEPTION 'Unexpected Lucyna function definition'; END IF;
  v_after := replace(v_after, $old$v_message jsonb; v_action jsonb;$old$, $new$v_message jsonb; v_variant jsonb; v_action jsonb;$new$);
  IF position($old$'catalogs','actions'))$old$ in v_after) = 0 THEN RAISE EXCEPTION 'Unexpected Lucyna function definition'; END IF;
  v_after := replace(v_after, $old$'catalogs','actions'))$old$, $new$'catalogs','actions','variants'))$new$);
  IF position($old$    if v_message ? 'actions' then$old$ in v_after) = 0 THEN RAISE EXCEPTION 'Unexpected Lucyna function definition'; END IF;
  v_after := replace(v_after, $old$    if v_message ? 'actions' then$old$, $new$
    if v_message ? 'variants' then
      if v_message->>'role' <> 'assistant'
        or jsonb_typeof(v_message->'variants') is distinct from 'array'
        or jsonb_array_length(v_message->'variants') <> 2
        or octet_length((v_message->'variants')::text) > 16000 then raise exception 'lucyna_invalid'; end if;
      for v_variant in select value from jsonb_array_elements(v_message->'variants') loop
        if jsonb_typeof(v_variant) is distinct from 'object'
          or jsonb_typeof(v_variant->'title') is distinct from 'string'
          or length(trim(v_variant->>'title')) not between 1 and 40
          or jsonb_typeof(v_variant->'body') is distinct from 'string'
          or length(trim(v_variant->>'body')) not between 1 and 1600
          or exists(select 1 from jsonb_object_keys(v_variant) k where k not in ('title','body'))
          then raise exception 'lucyna_invalid'; end if;
      end loop;
      if v_message->'variants'->0->>'body' = v_message->'variants'->1->>'body' then raise exception 'lucyna_invalid'; end if;
    end if;
    if v_message ? 'actions' then$new$);
  EXECUTE v_after;
  ALTER TABLE public.ideahire_lucyna_v2_threads
    DROP CONSTRAINT ideahire_lucyna_v2_threads_messages_check,
    ADD CONSTRAINT ideahire_lucyna_v2_threads_messages_check
      CHECK (jsonb_typeof(messages) = 'array' AND jsonb_array_length(messages) <= 200);
END
$migration$;

