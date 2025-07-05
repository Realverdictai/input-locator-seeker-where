-- Add proper numeric columns if they don't exist
ALTER TABLE cases_master
  ADD COLUMN IF NOT EXISTS settle_num          numeric,
  ADD COLUMN IF NOT EXISTS howell_num          numeric,
  ADD COLUMN IF NOT EXISTS med_specials_num    numeric,
  ADD COLUMN IF NOT EXISTS liab_pct_num        numeric,
  ADD COLUMN IF NOT EXISTS policy_limits_num   numeric;

-- Back-fill numeric columns from existing text
UPDATE cases_master
SET
  settle_num        = CASE WHEN settle IS NOT NULL AND settle ~ '^[0-9,.$\s]+$' 
                          THEN regexp_replace(settle, '[^0-9.]', '', 'g')::numeric 
                          ELSE NULL END,
  howell_num        = CASE WHEN howell IS NOT NULL AND howell ~ '^[0-9,.$\s]+$' 
                          THEN regexp_replace(howell, '[^0-9.]', '', 'g')::numeric 
                          ELSE NULL END,
  med_specials_num  = CASE WHEN med_specials IS NOT NULL AND med_specials ~ '^[0-9,.$\s]+$' 
                          THEN regexp_replace(med_specials, '[^0-9.]', '', 'g')::numeric 
                          ELSE NULL END,
  liab_pct_num      = CASE WHEN liab_pct IS NOT NULL AND liab_pct ~ '^[0-9.%\s]+$' 
                          THEN regexp_replace(liab_pct, '[^0-9.]', '', 'g')::numeric 
                          ELSE 100 END,
  policy_limits_num = CASE WHEN pol_lim IS NOT NULL AND pol_lim ~ '^[0-9,.$\s]+$' 
                          THEN regexp_replace(pol_lim, '[^0-9.]', '', 'g')::numeric 
                          ELSE NULL END;