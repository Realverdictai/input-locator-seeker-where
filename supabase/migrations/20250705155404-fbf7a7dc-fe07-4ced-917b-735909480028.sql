-- Add clean_data jsonb column to cases_master
ALTER TABLE cases_master
  ADD COLUMN IF NOT EXISTS clean_data jsonb;

-- Create function to normalize case data into structured JSON
CREATE OR REPLACE FUNCTION fn_normalize_case(p_case_id int)
RETURNS void LANGUAGE plpgsql AS $$
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
END $$;

-- Back-fill all existing rows
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT case_id FROM cases_master LOOP
    PERFORM fn_normalize_case(r.case_id);
  END LOOP;
END $$;

-- Create flat view for easy querying
CREATE OR REPLACE VIEW v_case_flat AS
SELECT
  case_id,
  (clean_data->>'caseType')::text           AS case_type,
  (clean_data->>'venue')::text              AS venue,
  (clean_data->>'dateOfLoss')::text         AS dol,
  (clean_data->>'accidentType')::text       AS acc_type,
  (clean_data->>'injuriesRaw')::text        AS injuries,
  (clean_data->>'liabilityPct')::numeric    AS liab_pct,
  (clean_data->>'policyLimits')::numeric    AS policy_limits,
  (clean_data->>'settlement')::numeric      AS settlement,
  (clean_data->>'hasSurgery')::boolean      AS has_surgery,
  (clean_data->>'hasInjections')::boolean   AS has_injections,
  (clean_data->>'surgeryCount')::integer    AS surgery_count,
  (clean_data->>'injectionCount')::integer  AS injection_count,
  clean_data->'surgeryList'                 AS surgery_list,
  clean_data->'injectionList'               AS injection_list,
  (clean_data->>'narrative')::text          AS narrative,
  clean_data                                AS structured_data
FROM cases_master
WHERE clean_data IS NOT NULL;