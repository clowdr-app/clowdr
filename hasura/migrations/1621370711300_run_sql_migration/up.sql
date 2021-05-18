CREATE INDEX "analytics_AppStats_created_at" ON "analytics"."AppStats" ("created_at" DESC);

CREATE VIEW "analytics"."RoomPresence" AS
SELECT 
    room.id, 
    room.name,
    stats.created_at,
    stats.pages->('PresenceList:' || encode(digest(conf.slug || '/conference/' || conf.slug || '/room/' || room.id, 'sha256'), 'hex')) as count
FROM "room"."Room" as room
JOIN "conference"."Conference" as conf
ON conf.id = room."conferenceId"
JOIN "analytics"."AppStats" as stats
ON "pages" ? ('PresenceList:' || encode(digest(conf.slug || '/conference/' || conf.slug || '/room/' || room.id, 'sha256'), 'hex'));
