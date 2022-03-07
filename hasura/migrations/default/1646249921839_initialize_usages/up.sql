INSERT INTO "conference"."Usage"(
    "conferenceId", 
    "consumedStreamingEventTotalMinutes", 
    "consumedVideoChatEventTotalMinutes", 
    "consumedVideoChatNonEventTotalMinutes"
)
SELECT
    conf.id as "conferenceId",
    ROUND(COALESCE(x.total, 0) / 60) as "consumedStreamingEventTotalMinutes",
    ROUND(COALESCE(y.total, 0) / 60) as "consumedVideoChatEventTotalMinutes",
    0 as "consumedVideoChatNonEventTotalMinutes"
FROM "conference"."Conference" as conf
LEFT JOIN (
    SELECT SUM(event1."durationSeconds") as total, event1."conferenceId"
    FROM "schedule"."Event" as event1
    WHERE (
        event1."intendedRoomModeName" = 'PRERECORDED'
        OR event1."intendedRoomModeName" = 'PRESENTATION'
        OR event1."intendedRoomModeName" = 'Q_AND_A'
    )
    GROUP BY event1."conferenceId"
) x
ON x."conferenceId" = conf."id"
LEFT JOIN (
    SELECT SUM(event2."durationSeconds") as total, event2."conferenceId"
    FROM "schedule"."Event" as event2
    WHERE (
        event2."intendedRoomModeName" = 'VIDEO_CHAT'
        OR event2."intendedRoomModeName" = 'SHUFFLE'
    )
    GROUP BY event2."conferenceId"
) y
ON y."conferenceId" = conf."id";
