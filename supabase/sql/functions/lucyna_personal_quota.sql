-- Raise the personal allowance without raising the provider's free budget or the global call cap.
-- Existing usage and request records remain intact. Status/take_slot count by authenticated user_id.
alter table public.ideahire_lucyna_v2_settings
  drop constraint ideahire_lucyna_v2_settings_user_daily_limit_check,
  drop constraint lucyna_poolfix_free_ceiling,
  add constraint ideahire_lucyna_v2_settings_user_daily_limit_check
    check (user_daily_limit between 1 and 350),
  add constraint lucyna_poolfix_free_ceiling
    check (user_daily_limit between 1 and 350 and daily_neuron_budget between 1 and 9000);

update public.ideahire_lucyna_v2_settings
set user_daily_limit = 350
where id = 1;
