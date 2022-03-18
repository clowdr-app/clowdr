-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- INSERT INTO "conference"."Quota"("conferenceId")
-- SELECT id as "conferenceId"
-- FROM "conference"."Conference";
--
-- INSERT INTO "conference"."Usage"(
--     "conferenceId",
--     "consumedStreamingEventTotalMinutes",
--     "consumedVideoChatEventTotalMinutes",
--     "consumedVideoChatNonEventTotalMinutes"
-- )
-- SELECT
--     conf.id as "conferenceId",
--     ROUND(x.total / 60) as "consumedStreamingEventTotalMinutes",
--     ROUND(y.total / 60) as "consumedVideoChatEventTotalMinutes",
--     ROUND(z.total / 60) as "consumedVideoChatNonEventTotalMinutes"
-- FROM "conference"."Conference" as conf
-- JOIN (
--     SELECT SUM(event1."durationSeconds") as total, event1."conferenceId"
--     FROM "schedule"."Event" as event1
--     WHERE (
--         event1."intendedRoomModeName" = 'PRERECORDED'
--         OR event1."intendedRoomModeName" = 'PRESENTATION'
--         OR event1."intendedRoomModeName" = 'Q_AND_A'
--     )
--     GROUP BY event1."conferenceId"
-- ) x
-- ON x."conferenceId" = conf."id"
-- JOIN (
--     SELECT SUM(event2."durationSeconds") as total, event2."conferenceId"
--     FROM "schedule"."Event" as event2
--     WHERE (
--         event2."intendedRoomModeName" = 'VIDEO_CHAT'
--         OR event2."intendedRoomModeName" = 'SHUFFLE'
--     )
--     GROUP BY event2."conferenceId"
-- ) y
-- ON y."conferenceId" = conf."id"
-- JOIN (
--     SELECT SUM(EXTRACT(EPOCH FROM ("stopped_at" - "created_at"))) as total, stream."conferenceId"
--     FROM "video"."VonageParticipantStream" as stream
--     WHERE NOT EXISTS (
--         SELECT 1 FROM "room"."Room" as innerRoom
--         WHERE innerRoom."publicVonageSessionId" = stream."vonageSessionId"
--         AND "room"."IsProgramRoom"(innerRoom)
--     )
--     AND NOT EXISTS (
--         SELECT 1 FROM "video"."EventVonageSession" as innerRoom
--         WHERE innerRoom."sessionId" = stream."vonageSessionId"
--     )
--     AND NOT (stopped_at IS NULL)
--     GROUP BY stream."conferenceId"
-- ) z
-- ON z."conferenceId" = conf."id";