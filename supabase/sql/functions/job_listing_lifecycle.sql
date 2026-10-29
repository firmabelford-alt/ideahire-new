-- A chosen job leaves the public catalogue without deleting the contractual record.
-- Payment records are read, never mutated, by this feature.
CREATE SCHEMA IF NOT EXISTS ideahire_listing;
REVOKE ALL ON SCHEMA ideahire_listing FROM PUBLIC, anon, authenticated;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS listing_stage text NOT NULL DEFAULT 'open';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_at timestamptz;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_listing_stage_valid CHECK (listing_stage IN ('open','assigned'));
CREATE INDEX IF NOT EXISTS conversations_job_id_idx ON public.conversations(job_id);

CREATE OR REPLACE FUNCTION ideahire_listing.guard_job()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  bound_at timestamptz;
  trusted_maintenance boolean := auth.uid() IS NULL OR coalesce(current_setting('app.ideahire_erasure_operation',true),'')='on';
BEGIN
  IF TG_OP='INSERT' THEN
    NEW.listing_stage := 'open'; NEW.assigned_at := NULL;
    RETURN NEW;
  END IF;
  IF OLD.source_type IS DISTINCT FROM 'client_posted' THEN
    IF TG_OP='DELETE' THEN RETURN OLD; END IF;
    NEW.listing_stage := OLD.listing_stage; NEW.assigned_at := OLD.assigned_at;
    RETURN NEW;
  END IF;
  SELECT min(coalesce(a.accepted_at,a.client_accepted_at,a.contractor_accepted_at,a.created_at)) INTO bound_at
  FROM public.conversations c JOIN public.conversation_agreements a ON a.conversation_id=c.id
  WHERE c.job_id=OLD.id AND (a.accepted_at IS NOT NULL OR a.status='accepted');
  IF TG_OP='DELETE' THEN
    IF NOT trusted_maintenance AND (OLD.listing_stage='assigned' OR bound_at IS NOT NULL) THEN
      RAISE EXCEPTION 'Zlecenie ma zaakceptowane ustalenia. Pozostaje w prywatnej historii współpracy.' USING ERRCODE='23514';
    END IF;
    RETURN OLD;
  END IF;
  IF NOT trusted_maintenance AND NEW.source_type IS DISTINCT FROM OLD.source_type THEN
    RAISE EXCEPTION 'Nie można zmienić pochodzenia ogłoszenia.' USING ERRCODE='23514';
  END IF;
  IF OLD.listing_stage='assigned' OR bound_at IS NOT NULL THEN
    IF NOT trusted_maintenance AND OLD.listing_stage='assigned'
      AND (to_jsonb(NEW)-ARRAY['listing_stage','assigned_at','visibility','updated_at'])
        IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['listing_stage','assigned_at','visibility','updated_at']) THEN
      RAISE EXCEPTION 'Treść zlecenia pozostaje zapisem współpracy. Zmiany ustal z wykonawcą w rozmowie.' USING ERRCODE='23514';
    END IF;
    NEW.listing_stage := 'assigned'; NEW.assigned_at := coalesce(OLD.assigned_at,bound_at,statement_timestamp());
    NEW.visibility := 'private';
  ELSE
    NEW.listing_stage := 'open'; NEW.assigned_at := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION ideahire_listing.guard_agreement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  job_row public.jobs%ROWTYPE;
  conversation_row public.conversations%ROWTYPE;
BEGIN
  SELECT * INTO conversation_row FROM public.conversations WHERE id=NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    SELECT * INTO job_row FROM public.jobs WHERE id=conversation_row.job_id;
  ELSE
    -- All acceptance endpoints share the job row lock, including older RPC versions.
    SELECT * INTO job_row FROM public.jobs WHERE id=conversation_row.job_id FOR UPDATE;
  END IF;
  IF NOT FOUND OR job_row.source_type IS DISTINCT FROM 'client_posted' THEN RETURN NEW; END IF;
  IF job_row.user_id IS DISTINCT FROM conversation_row.client_id THEN
    RAISE EXCEPTION 'Zlecenie i zleceniodawca nie są zgodni.' USING ERRCODE='23514';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.conversation_agreements a ON a.conversation_id=c.id
    WHERE c.job_id=job_row.id AND c.id<>NEW.conversation_id AND (a.accepted_at IS NOT NULL OR a.status='accepted')
  ) AND (TG_OP='INSERT' OR NEW.status='accepted'
    OR (TG_OP='UPDATE' AND (NEW.client_accepted_at IS DISTINCT FROM OLD.client_accepted_at
      OR NEW.contractor_accepted_at IS DISTINCT FROM OLD.contractor_accepted_at))) THEN
    RAISE EXCEPTION 'Do tego zlecenia wybrano już wykonawcę. Istniejące rozmowy i ustalenia pozostają dostępne.' USING ERRCODE='23514';
  END IF;
  IF NEW.status='accepted' AND (NEW.client_accepted_at IS NULL OR NEW.contractor_accepted_at IS NULL OR NEW.accepted_at IS NULL) THEN
    RAISE EXCEPTION 'Wymagana jest akceptacja tej samej wersji ustaleń przez obie strony.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION ideahire_listing.sync_accepted_job()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.accepted_at IS NOT NULL OR NEW.status='accepted' THEN
    UPDATE public.jobs j SET listing_stage=j.listing_stage
    FROM public.conversations c
    WHERE c.id=NEW.conversation_id AND j.id=c.job_id AND j.source_type='client_posted'
      AND (j.listing_stage<>'assigned' OR j.visibility<>'private');
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION ideahire_listing.guard_new_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE job_row public.jobs%ROWTYPE;
BEGIN
  SELECT * INTO job_row FROM public.jobs WHERE id=NEW.job_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF (TG_TABLE_NAME='job_applications' AND job_row.source_type IS DISTINCT FROM 'client_posted')
    OR job_row.source_type='client_posted' AND (job_row.listing_stage<>'open' OR job_row.visibility<>'public' OR job_row.expires_at<=statement_timestamp()) THEN
    RAISE EXCEPTION 'To ogłoszenie nie przyjmuje nowych zgłoszeń. Istniejącą współpracę znajdziesz w Centrum pracy.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ideahire_listing FROM PUBLIC, anon, authenticated;
CREATE TRIGGER zz_ih_listing_job_guard BEFORE INSERT OR UPDATE OR DELETE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION ideahire_listing.guard_job();
CREATE TRIGGER zz_ih_listing_agreement_guard BEFORE INSERT OR UPDATE OF status,client_accepted_at,contractor_accepted_at,accepted_at ON public.conversation_agreements
  FOR EACH ROW EXECUTE FUNCTION ideahire_listing.guard_agreement();
CREATE TRIGGER zz_ih_listing_agreement_sync AFTER INSERT OR UPDATE OF status,accepted_at ON public.conversation_agreements
  FOR EACH ROW EXECUTE FUNCTION ideahire_listing.sync_accepted_job();
CREATE TRIGGER zz_ih_listing_new_conversation BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION ideahire_listing.guard_new_contact();
CREATE TRIGGER zz_ih_listing_new_application BEFORE INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION ideahire_listing.guard_new_contact();

-- Preserve every historical collaboration, including legacy multiple acceptances.
-- This changes catalogue visibility and metadata only; no content or money is removed.
UPDATE public.jobs j SET listing_stage=j.listing_stage
WHERE j.source_type='client_posted' AND EXISTS (
  SELECT 1 FROM public.conversations c JOIN public.conversation_agreements a ON a.conversation_id=c.id
  WHERE c.job_id=j.id AND (a.accepted_at IS NOT NULL OR a.status='accepted')
);

CREATE POLICY ih_listing_anon_public_only ON public.jobs AS RESTRICTIVE FOR SELECT TO anon
  USING (visibility='public' AND listing_stage='open');

-- Finance tables intentionally have no browser SELECT policies. Return only the
-- authenticated owner's coarse workspace state, not amounts or Stripe identifiers.
CREATE OR REPLACE FUNCTION ideahire_listing.my_states()
RETURNS TABLE(job_id uuid, workspace_stage text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT j.id, CASE
    WHEN j.listing_stage='open' THEN 'open'
    WHEN NOT EXISTS (
      SELECT 1 FROM public.conversations c JOIN public.conversation_agreements a ON a.conversation_id=c.id
      WHERE c.job_id=j.id AND (a.accepted_at IS NOT NULL OR a.status='accepted')
    ) THEN 'assigned'
    WHEN EXISTS (
      SELECT 1 FROM public.conversations c JOIN public.conversation_agreements a ON a.conversation_id=c.id
      WHERE c.job_id=j.id AND (a.accepted_at IS NOT NULL OR a.status='accepted')
        AND NOT EXISTS (SELECT 1 FROM public.ideahire_payments p WHERE p.agreement_id=a.id
          AND ((p.status='released' AND p.released_at IS NOT NULL AND p.stripe_transfer_id IS NOT NULL)
            OR (p.status='refunded' AND p.refunded_at IS NOT NULL AND p.refunded_amount_grosz=p.total_amount_grosz)))
    ) THEN 'assigned'
    WHEN EXISTS (
      SELECT 1 FROM public.conversations c JOIN public.disputes d ON d.conversation_id=c.id
      WHERE c.job_id=j.id AND d.status NOT IN ('closed','cancelled')
    ) THEN 'assigned'
    ELSE 'archived'
  END
  FROM public.jobs j WHERE j.user_id=(SELECT auth.uid()) AND j.source_type='client_posted'
    AND public.ideahire_profile_contact_account_enabled((SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION ideahire_listing.my_states() FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA ideahire_listing TO authenticated;
GRANT EXECUTE ON FUNCTION ideahire_listing.my_states() TO authenticated;
CREATE OR REPLACE FUNCTION public.ideahire_my_job_listing_states()
RETURNS TABLE(job_id uuid, workspace_stage text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog AS $$
  SELECT * FROM ideahire_listing.my_states();
$$;
REVOKE ALL ON FUNCTION public.ideahire_my_job_listing_states() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ideahire_my_job_listing_states() TO authenticated;
COMMENT ON COLUMN public.jobs.listing_stage IS 'Catalogue lifecycle only. assigned always stays private. Settlement/archive state is read separately; no contractual evidence is deleted.';
NOTIFY pgrst, 'reload schema';
