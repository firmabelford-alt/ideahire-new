-- Lucyna searches the same public, active, client-posted jobs as /jobs.
-- Replace only the search body; CREATE OR REPLACE preserves existing execution grants.
-- SECURITY INVOKER keeps the caller's RLS. No listing or account data is changed.
CREATE OR REPLACE FUNCTION public.ideahire_lucyna_v3_search_jobs(
  p_search text DEFAULT NULL, p_category text DEFAULT NULL, p_limit integer DEFAULT 5
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path TO pg_catalog, public
AS $function$
DECLARE
  v_query text := btrim(coalesce(p_search,''));
  v_category text := btrim(coalesce(p_category,''));
  v_literal text;
  v_terms text[];
  v_tsquery tsquery;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'lucyna_auth'; END IF;
  IF length(v_query)>60 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'lucyna_invalid';
  END IF;
  v_category := CASE v_category
    WHEN 'Programowanie' THEN 'Strony, aplikacje i IT'
    WHEN 'Grafika i design' THEN 'Grafika, UX i 3D'
    WHEN 'Marketing' THEN 'Marketing i sprzedaż'
    WHEN 'Copywriting' THEN 'Teksty i tłumaczenia'
    WHEN 'Video' THEN 'Wideo, animacja i audio'
    WHEN 'Fotografia' THEN 'Fotografia i obróbka zdjęć'
    ELSE v_category END;
  IF v_category<>'' AND v_category NOT IN (
    'Strony, aplikacje i IT','Grafika, UX i 3D','Marketing i sprzedaż','Teksty i tłumaczenia',
    'Wideo, animacja i audio','Fotografia i obróbka zdjęć','AI i automatyzacje',
    'Dane, analizy i research','Biznes i e-commerce','Architektura, wnętrza i CAD'
  ) THEN RAISE EXCEPTION 'lucyna_invalid'; END IF;
  v_literal := translate(lower(v_query),'ąćęłńóśźż','acelnoszz');
  -- Common Polish web requests must find a category, not require an exact inflection in a title.
  v_literal := regexp_replace(v_literal,'\m(stron[a-z]*|witryn[a-z]*|websites?|www)\M','stron','g');
  v_literal := regexp_replace(v_literal,'\m(internetow)[a-z]*\M','\1','g');
  v_literal := regexp_replace(v_literal,'\m(aplikacj)[a-z]*\M','\1','g');
  SELECT coalesce(array_agg(DISTINCT term),'{}'::text[]) INTO v_terms
  FROM regexp_split_to_table(v_literal,'[^a-z0-9]+') term
  WHERE length(term)>=2 AND term NOT IN (
    'znajdz','znajdzmy','szukam','szukaj','wyszukaj','jakies','jakiegos','jakis','cos',
    'prosze','mi','dla','mnie','ze','na','do','od','po','oraz','przy','naszej',
    'zlecenie','zlecenia','zlecen','ogloszenie','ogloszenia','oferta','oferty',
    'potrzebuje','chce','dotyczace','zwiazane','zrobienia','wykonania'
  );
  IF cardinality(v_terms)>0 AND v_literal !~ '[+#]' THEN
    SELECT to_tsquery('simple'::regconfig,string_agg(quote_literal(term)||':*',' & '))
      INTO v_tsquery FROM unnest(v_terms) term;
  ELSIF v_query<>'' AND v_literal !~ '[a-z0-9]' THEN
    RETURN jsonb_build_object('items','[]'::jsonb,'total',0);
  ELSIF v_literal !~ '[+#]' THEN
    v_literal := '';
  END IF;
  WITH eligible AS MATERIALIZED (
    SELECT j.id,j.title,j.description,j.category,j.budget,j.budget_negotiable,j.created_at,
      translate(lower(concat_ws(' ',j.title,j.description,j.category,j.subcategory,j.expected_outcome,
        array_to_string(j.required_skills,' '),
        CASE WHEN j.category IN ('Programowanie','Strony, aplikacje i IT')
          THEN 'strony aplikacje programowanie programista strona internetowa www witryna web website'
          WHEN j.category IN ('Grafika i design','Grafika, UX i 3D') THEN 'grafika design UX 3D'
          WHEN j.category IN ('Marketing','Marketing i sprzedaż') THEN 'marketing sprzedaz'
          WHEN j.category IN ('Copywriting','Teksty i tłumaczenia') THEN 'copywriting teksty tlumaczenia'
          WHEN j.category IN ('Video','Wideo, animacja i audio') THEN 'video wideo animacja audio'
          WHEN j.category IN ('Fotografia','Fotografia i obróbka zdjęć') THEN 'fotografia obrobka zdjecia'
          ELSE '' END)),'ąćęłńóśźż','acelnoszz') AS search_text
    FROM public.jobs j
    WHERE j.expires_at>now() AND j.visibility='public' AND j.source_type='client_posted'
      AND (v_category='' OR j.category=v_category OR j.category=CASE v_category
        WHEN 'Strony, aplikacje i IT' THEN 'Programowanie'
        WHEN 'Grafika, UX i 3D' THEN 'Grafika i design'
        WHEN 'Marketing i sprzedaż' THEN 'Marketing'
        WHEN 'Teksty i tłumaczenia' THEN 'Copywriting'
        WHEN 'Wideo, animacja i audio' THEN 'Video'
        WHEN 'Fotografia i obróbka zdjęć' THEN 'Fotografia'
        ELSE v_category END)
  ), matched AS MATERIALIZED (
    SELECT id,title,description,category,budget,budget_negotiable,created_at FROM eligible
    WHERE v_literal='' OR position(v_literal IN search_text)>0
      OR (v_tsquery IS NOT NULL AND to_tsvector('simple'::regconfig,search_text) @@ v_tsquery)
  ), limited AS (
    SELECT * FROM matched ORDER BY created_at DESC,id LIMIT p_limit
  )
  SELECT jsonb_build_object(
    'items',coalesce((SELECT jsonb_agg(to_jsonb(limited) ORDER BY created_at DESC,id) FROM limited),'[]'::jsonb),
    'total',(SELECT count(*) FROM matched)) INTO v_result;
  RETURN v_result;
END $function$;
