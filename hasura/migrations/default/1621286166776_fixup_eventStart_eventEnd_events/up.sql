WITH
	hasuraEvents as (
		SELECT 
			DISTINCT ON (event_url, eventId)
			*, 
			hasuraEvent.webhook_conf::text as event_url,
			CAST(hasuraEvent.payload->>'updatedAt' as bigint) as the_timestamp,
			CAST(hasuraEvent.payload->>'eventId' as uuid) as eventId
		FROM hdb_catalog.hdb_scheduled_events AS hasuraEvent
		WHERE hasuraEvent.status = 'scheduled'
		AND (hasuraEvent.webhook_conf::text) = ANY('{"\"{{ACTION_BASE_URL}}/event/notifyStart\"", "\"{{ACTION_BASE_URL}}/event/notifyEnd\""}')
		ORDER BY event_url, eventId, the_timestamp DESC
	),
	mismatchedEvents as (
		SELECT hasuraEvent.*, TRUNC(EXTRACT(epoch from clowdrEvent.updated_at) * 1000)::bigint as new_timestamp FROM hasuraEvents as hasuraEvent
		INNER JOIN "schedule"."Event" as clowdrEvent
		ON hasuraEvent.eventId = clowdrEvent.id
		AND TRUNC(EXTRACT(epoch from clowdrEvent.updated_at) * 1000)::bigint != hasuraEvent.the_timestamp
	)
UPDATE hdb_catalog.hdb_scheduled_events
SET
 	payload = jsonb_set(hdb_catalog.hdb_scheduled_events.payload::jsonb, '{"updatedAt"}', to_jsonb(mismatchedEvents.new_timestamp))::json
FROM mismatchedEvents
WHERE hdb_catalog.hdb_scheduled_events.id = mismatchedEvents.id;
