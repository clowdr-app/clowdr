CREATE OR REPLACE VIEW "room"."LivestreamDurations" AS
SELECT "conferenceId", "roomId", SUM("durationSeconds") FROM "schedule"."Event"
WHERE "intendedRoomModeName" = ANY ('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')
GROUP BY "conferenceId", "roomId";
