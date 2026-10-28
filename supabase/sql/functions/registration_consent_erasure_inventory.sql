-- Run after registration_consent_history.sql.
-- Add the retained evidence count to the live inventory without replacing its
-- other logic, permissions, blockers or authorization checks.
set local lock_timeout = '5s';
set local statement_timeout = '30s';
do $migration$
declare
  v_definition text := pg_get_functiondef('public.ideahire_build_erasure_inventory(uuid)'::regprocedure);
  v_needle text := '''legal_acceptances'', v_legal_acceptance_count,';
begin
  if position('''registration_consent_events''' in v_definition) > 0 then
    raise exception 'Consent history is already included; review the current inventory before reapplying.';
  end if;
  if length(v_definition) - length(replace(v_definition, v_needle, '')) <> length(v_needle) then
    raise exception 'Unexpected erasure inventory structure; no change applied.';
  end if;
  execute replace(v_definition, v_needle,
    v_needle || E'\n        ''registration_consent_events'', (select count(*) from public.ideahire_registration_consent_events where user_id = p_target_user_id),');
end;
$migration$;
