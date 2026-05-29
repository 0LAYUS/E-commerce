BEGIN;

-- Event trigger: auto-enable RLS on all new tables
-- This ensures no table is ever created without RLS protection

CREATE OR REPLACE FUNCTION public.auto_enable_rls()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands()
    WHERE command_tag = 'CREATE TABLE'
  LOOP
    -- Skip internal Supabase tables
    IF obj.object_identity NOT LIKE 'auth.%'
       AND obj.object_identity NOT LIKE 'storage.%'
       AND obj.object_identity NOT LIKE 'graphql.%'
       AND obj.object_identity NOT LIKE 'realtime.%'
       AND obj.object_identity NOT LIKE 'pg_%'
       AND obj.object_identity NOT LIKE '_analytics.%'
    THEN
      EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', obj.object_identity);
    END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS auto_enable_rls_trigger;
CREATE EVENT TRIGGER auto_enable_rls_trigger
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE')
  EXECUTE FUNCTION public.auto_enable_rls();

COMMIT;
