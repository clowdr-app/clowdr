CREATE OR REPLACE PROCEDURE public.truncate_hasura_logs()
LANGUAGE 'plpgsql'
AS
$$
BEGIN
    DELETE FROM hdb_catalog.event_invocation_logs
    WHERE created_at < now() - INTERVAL '7 days';
    
    DELETE FROM hdb_catalog.event_log
    WHERE (delivered = true OR error = true)
    AND created_at < now() - INTERVAL '7 days';
END;
$$;

COMMENT ON PROCEDURE public.truncate_hasura_logs()
    IS 'Deletes event logs and event invocation logs older than seven days.';
