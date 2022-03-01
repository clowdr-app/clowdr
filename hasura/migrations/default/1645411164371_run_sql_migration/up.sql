CREATE OR REPLACE PROCEDURE clear_hasura_tables()
LANGUAGE SQL
AS $function$

DELETE FROM hdb_catalog.event_invocation_logs
WHERE created_at < now() - INTERVAL '5 days';

DELETE FROM hdb_catalog.event_log
WHERE (delivered = true OR error = true)
AND created_at < now() - INTERVAL '5 days';

DELETE FROM hdb_catalog.event_log
WHERE created_at < now() - INTERVAL '10 days';

DELETE FROM hdb_catalog.hdb_action_log
WHERE created_at < now() - INTERVAL '10 days';

DELETE FROM hdb_catalog.hdb_scheduled_event_invocation_logs
WHERE created_at < now() - INTERVAL '10 days';

DELETE FROM hdb_catalog.hdb_scheduled_events
WHERE scheduled_time < now() - INTERVAL '2 days';

DELETE FROM hdb_catalog.hdb_cron_event_invocation_logs
WHERE created_at < now() - INTERVAL '10 days';

DELETE FROM hdb_catalog.hdb_cron_events
WHERE scheduled_time < now() - INTERVAL '2 days';

$function$;
