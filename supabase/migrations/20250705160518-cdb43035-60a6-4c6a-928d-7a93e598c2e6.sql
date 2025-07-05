-- Update v_case_flat view to include is_outlier logic
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
  clean_data                                AS structured_data,
  -- Add is_outlier logic
  CASE 
    WHEN ((clean_data->>'surgeryCount')::integer > 0 OR (clean_data->>'injectionCount')::integer > 0)
         AND (clean_data->>'settlement')::numeric < 0.75 * (clean_data->>'policyLimits')::numeric
         AND (clean_data->>'policyLimits')::numeric <= 150000
    THEN TRUE
    ELSE FALSE
  END AS is_outlier
FROM cases_master
WHERE clean_data IS NOT NULL;