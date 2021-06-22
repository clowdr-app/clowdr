-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- INSERT INTO "schedule"."Continuation" ("fromEvent", "colour", "defaultFor", "description", "isActiveChoice", "priority", "to")
SELECT 
    id as "fromEvent",
    '#4471de' as colour,
    'None' as "defaultFor",
    'Join the discussion room' as "description",
    false::boolean as "isActiveChoice",
    0::integer as priority,
    '{ "type": "AutoDiscussionRoom", "id": null }'::jsonb as to
FROM "schedule"."Event" as event
WHERE (event."intendedRoomModeName" = 'PRESENTATION' OR event."intendedRoomModeName" = 'Q_AND_A')
AND event."itemId" IS NOT NULL;
