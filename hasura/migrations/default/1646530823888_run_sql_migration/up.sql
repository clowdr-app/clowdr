DROP FUNCTION IF EXISTS conference."updateEventUsage";

CREATE OR REPLACE FUNCTION conference."updateEventUsage"()
 RETURNS SETOF conference."Usage"
 LANGUAGE plpgsql
AS $function$
DECLARE
    nowTime timestamp;
BEGIN
    nowTime := now();

    RETURN QUERY 
        UPDATE "conference"."Usage" as usage
        SET "consumedStreamingEventTotalMinutes" 
                = usage."consumedStreamingEventTotalMinutes"
                + CAST(ROUND(COALESCE(
                    (
                        SELECT SUM(
                            GREATEST(0, LEAST(
                                -- time between last update and now
                                EXTRACT(EPOCH FROM now() - usage."lastUpdatedConsumedStreamingEventTotalMinutes")
                                ,
                                LEAST(
                                    -- duration of the event
                                    event."durationSeconds"
                                    ,
                                    LEAST(
                                        -- time between last update and end of event
                                        event."durationSeconds" + EXTRACT(EPOCH FROM event."startTime" - usage."lastUpdatedConsumedStreamingEventTotalMinutes")
                                        ,
                                        -- time between start of event and now
                                        EXTRACT(EPOCH FROM now() - event."startTime")
                                    )
                                )
                            ))
                        )
                        FROM "schedule"."Event" as event
                        WHERE usage."conferenceId" = event."conferenceId"
                        AND event."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')
                        AND event."startTime" < now()
                        AND event."startTime" + (event."durationSeconds" * interval '1 second') >= usage."lastUpdatedConsumedStreamingEventTotalMinutes"
                    )
                    , 0) / 60) as Integer),
            "lastUpdatedConsumedStreamingEventTotalMinutes" = nowTime,
            "consumedVideoChatEventTotalMinutes" 
                = usage."consumedVideoChatEventTotalMinutes"
                + CAST(ROUND(COALESCE(
                    (
                        SELECT SUM(
                            GREATEST(0, LEAST(
                                -- time between last update and now
                                EXTRACT(EPOCH FROM now() - usage."lastUpdatedConsumedVideoChatEventTotalMinutes")
                                ,
                                LEAST(
                                    -- duration of the event
                                    event."durationSeconds"
                                    ,
                                    LEAST(
                                        -- time between last update and end of event
                                        event."durationSeconds" + EXTRACT(EPOCH FROM event."startTime" - usage."lastUpdatedConsumedVideoChatEventTotalMinutes")
                                        ,
                                        -- time between start of event and now
                                        EXTRACT(EPOCH FROM now() - event."startTime")
                                    )
                                )
                            ))
                        )
                        FROM "schedule"."Event" as event
                        WHERE usage."conferenceId" = event."conferenceId"
                        AND event."intendedRoomModeName" = 'VIDEO_CHAT'
                        AND event."startTime" < now()
                        AND event."startTime" + (event."durationSeconds" * interval '1 second') >= usage."lastUpdatedConsumedVideoChatEventTotalMinutes"
                    )
                    , 0) / 60) as Integer),
            "lastUpdatedConsumedVideoChatEventTotalMinutes" = nowTime
        RETURNING usage.*;
        
    RETURN;
END;
$function$
