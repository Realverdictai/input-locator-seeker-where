-- Automatically normalize case data on insert or update

-- Trigger function that calls fn_normalize_case for new or updated rows
CREATE OR REPLACE FUNCTION trg_normalize_case()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM fn_normalize_case(NEW.case_id);
  RETURN NEW;
END
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_cases_master_normalize ON cases_master;
CREATE TRIGGER trg_cases_master_normalize
AFTER INSERT OR UPDATE ON cases_master
FOR EACH ROW EXECUTE FUNCTION trg_normalize_case();
