-- Fix remaining function search path issues
CREATE OR REPLACE FUNCTION public.fn_normalize_case(p_case_id integer)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  r   RECORD;
  js  jsonb;
  surgery_array text[];
  injection_array text[];
BEGIN
  SELECT * INTO r FROM cases_master WHERE case_id = p_case_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Parse surgery list from text
  IF r.surgery IS NOT NULL AND r.surgery != '' AND r.surgery != 'None' THEN
    surgery_array := regexp_split_to_array(trim(lower(r.surgery)), '[,;]+');
  ELSE
    surgery_array := ARRAY[]::text[];
  END IF;
  
  -- Parse injection list from text  
  IF r.inject IS NOT NULL AND r.inject != '' AND r.inject != 'None' THEN
    injection_array := regexp_split_to_array(trim(lower(r.inject)), '[,;]+');
  ELSE
    injection_array := ARRAY[]::text[];
  END IF;

  -- Build structured JSON object
  js := jsonb_build_object(
    'caseType',        r.case_type,
    'venue',           r.venue,
    'dateOfLoss',      r.dol,
    'accidentType',    r.acc_type,
    'injuriesRaw',     r.injuries,
    'surgeryList',     surgery_array,
    'injectionList',   injection_array,
    'liabilityPct',    COALESCE(r.liab_pct_num, 
                         CASE WHEN r.liab_pct ~ '^[0-9.%\s]+$' 
                              THEN regexp_replace(r.liab_pct, '[^0-9.]', '', 'g')::numeric 
                              ELSE 100 END),
    'policyLimits',    COALESCE(r.policy_limits_num,
                         CASE WHEN r.pol_lim ~ '^[0-9,.$\s]+$'
                              THEN regexp_replace(r.pol_lim, '[^0-9.]', '', 'g')::numeric
                              ELSE NULL END),
    'settlement',      COALESCE(r.settle_num,
                         CASE WHEN r.settle ~ '^[0-9,.$\s]+$'
                              THEN regexp_replace(r.settle, '[^0-9.]', '', 'g')::numeric
                              ELSE NULL END),
    'narrative',       r.narrative,
    'hasSurgery',      (r.surgery IS NOT NULL AND r.surgery != '' AND r.surgery != 'None'),
    'hasInjections',   (r.inject IS NOT NULL AND r.inject != '' AND r.inject != 'None'),
    'surgeryCount',    CASE WHEN r.surgery IS NOT NULL AND r.surgery != '' AND r.surgery != 'None'
                            THEN array_length(surgery_array, 1) 
                            ELSE 0 END,
    'injectionCount',  CASE WHEN r.inject IS NOT NULL AND r.inject != '' AND r.inject != 'None'
                            THEN array_length(injection_array, 1)
                            ELSE 0 END
  );

  UPDATE cases_master
    SET clean_data = js
  WHERE case_id = p_case_id;
END $function$;

-- Fix hybrid_case_similarity function
CREATE OR REPLACE FUNCTION public.hybrid_case_similarity(query_embedding vector, query_liab_pct numeric DEFAULT 100, query_policy_bucket text DEFAULT 'low'::text, query_tbi_level integer DEFAULT 0, query_has_surgery boolean DEFAULT false, result_limit integer DEFAULT 25)
RETURNS TABLE(case_id integer, surgery text, inject text, injuries text, settle text, pol_lim text, venue text, liab_pct text, acc_type text, narrative text, score numeric)
LANGUAGE sql
SET search_path = public
AS $function$
  SELECT 
    c.case_id,
    c.surgery,
    c.inject,
    c.injuries,
    c.settle,
    c.pol_lim,
    c.venue,
    c.liab_pct,
    c.acc_type,
    c.narrative,
    (
      -- Cosine similarity (0.5 weight)
      0.5 * (1 - (c.embedding <=> query_embedding)) +
      
      -- Liability percentage proximity (0.2 weight) - use numeric column first
      0.2 * (100 - ABS(COALESCE(c.liab_pct_num, c.liab_pct::numeric, 100) - query_liab_pct)) / 100 +
      
      -- Policy bucket match (0.1 weight) - use numeric column first
      0.1 * CASE 
        WHEN (
          COALESCE(c.policy_limits_num, 
            CASE WHEN c.pol_lim ~ '^[0-9,.$]+$' 
                 THEN REPLACE(REPLACE(REPLACE(c.pol_lim, '$', ''), ',', ''), '.', '')::numeric
                 ELSE 0 END
          ) > 500000 AND query_policy_bucket = 'high'
        ) OR (
          COALESCE(c.policy_limits_num,
            CASE WHEN c.pol_lim ~ '^[0-9,.$]+$'
                 THEN REPLACE(REPLACE(REPLACE(c.pol_lim, '$', ''), ',', ''), '.', '')::numeric
                 ELSE 0 END
          ) BETWEEN 100000 AND 500000 AND query_policy_bucket = 'mid'
        ) OR (
          COALESCE(c.policy_limits_num,
            CASE WHEN c.pol_lim ~ '^[0-9,.$]+$'
                 THEN REPLACE(REPLACE(REPLACE(c.pol_lim, '$', ''), ',', ''), '.', '')::numeric
                 ELSE 0 END
          ) < 100000 AND query_policy_bucket = 'low'
        ) THEN 1 ELSE 0 END +
      
      -- TBI level match (0.1 weight)
      0.1 * CASE WHEN query_tbi_level > 0 AND c.injuries ILIKE '%TBI%' THEN 1 ELSE 0 END +
      
      -- Surgery match (0.1 weight)  
      0.1 * CASE WHEN query_has_surgery AND c.surgery IS NOT NULL AND c.surgery != 'None' THEN 1 ELSE 0 END
    ) AS score
  FROM cases_master c
  WHERE c.embedding IS NOT NULL 
    AND (c.settle_num IS NOT NULL OR (c.settle IS NOT NULL AND c.settle != ''))
  ORDER BY score DESC
  LIMIT result_limit;
$function$;