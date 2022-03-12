CREATE OR REPLACE FUNCTION "schedule"."checkInsertEvent"()
  RETURNS trigger AS
$func$
BEGIN
    RETURN NEW;
END
$func$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION schedule."checkUpdateEvent"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN NEW;
END
$function$;



----------------------------------------------------------------



UPDATE schedule."Event"
SET "intendedRoomModeName" = 'LIVESTREAM'
WHERE "intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}');

DELETE FROM schedule."Mode"
WHERE name = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}');

----------------------------------------------------------------



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
                        AND event."intendedRoomModeName" = 'LIVESTREAM'
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
$function$;


CREATE OR REPLACE FUNCTION "schedule"."checkInsertEvent"()
  RETURNS trigger AS
$func$
BEGIN
    IF (NEW."intendedRoomModeName" = 'LIVESTREAM') THEN
        IF NOT (SELECT "areStreamingEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
            RAISE EXCEPTION 'Quota limit reached (streaming events not included)';
        END IF;

        IF (SELECT "maxStreamingEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < NEW."durationSeconds" THEN
            RAISE EXCEPTION 'Quota limit reached (streaming event duration)';
        END IF;
        
        IF (SELECT "remainingStreamingEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60 < NEW."durationSeconds" THEN
            RAISE EXCEPTION 'Quota limit reached (total streaming event minutes)';
        END IF;
        
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND NOT (event1."intendedRoomModeName" = 'LIVESTREAM')
            )) THEN
            RAISE EXCEPTION 'Room is a non-streaming program room.';
        END IF;
        
        IF (
            -- Not already a program room
            NOT EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
            )
            -- And streaming program room quota limit reached
            AND (SELECT "remainingStreamingProgramRooms" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0
        )
        THEN
            RAISE EXCEPTION 'Quota limit reached (streaming program rooms)';
        END IF;
    ELSEIF (NEW."intendedRoomModeName" = 'VIDEO_CHAT') THEN
        IF NOT (SELECT "areVideoChatEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
            RAISE EXCEPTION 'Quota limit reached (video-chat events not included)';
        END IF;

        IF (SELECT "maxVideoChatEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < NEW."durationSeconds" THEN
            RAISE EXCEPTION 'Quota limit reached (video-chat event duration)';
        END IF;
        
        IF (SELECT "remainingVideoChatEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60 < NEW."durationSeconds" THEN
            RAISE EXCEPTION 'Quota limit reached (total video-chat event minutes)';
        END IF;
        
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."intendedRoomModeName" = 'LIVESTREAM'
            )) THEN
            RAISE EXCEPTION 'Room is a streaming program room.';
        END IF;
        
        IF (
            -- Not already a program room
            NOT EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
            )
            -- And non-streaming program room quota limit reached
            AND (SELECT "remainingNonStreamingProgramRooms" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0
        )
        THEN
            RAISE EXCEPTION 'Quota limit reached (non-streaming program rooms)';
        END IF;
    ELSE
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."intendedRoomModeName" = 'LIVESTREAM'
            )) THEN
            RAISE EXCEPTION 'Room is a streaming program room.';
        END IF;
        
        IF (
            -- Not already a program room
            NOT EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
            )
            -- And non-streaming program room quota limit reached
            AND (SELECT "remainingNonStreamingProgramRooms" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0
        )
        THEN
            RAISE EXCEPTION 'Quota limit reached (non-streaming program rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$func$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION schedule."checkUpdateEvent"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (OLD."roomId" = NEW."roomId"
        AND OLD."startTime" = NEW."startTime"
        AND OLD."durationSeconds" = NEW."durationSeconds"
        AND OLD."intendedRoomModeName" = NEW."intendedRoomModeName") THEN
        RETURN NEW;
    END IF;

    IF (NEW."intendedRoomModeName" = 'LIVESTREAM') THEN
        IF (NOT (OLD."intendedRoomModeName" = 'LIVESTREAM')) THEN
            IF NOT (SELECT "areStreamingEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
                RAISE EXCEPTION 'Quota limit reached (streaming events not included)';
            END IF;
        END IF;

        IF (SELECT "maxStreamingEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < NEW."durationSeconds" THEN
            RAISE EXCEPTION 'Quota limit reached (streaming event duration)';
        END IF;
        
        IF (GREATEST(0, LEAST(OLD."durationSeconds", (EXTRACT (EPOCH FROM (OLD."startTime" - NOW()))) + OLD."durationSeconds"))
            + ((SELECT "remainingStreamingEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60)
            < 
            -- (Start Time + Duration) = End Time
            -- End Time - Now = Time remaining in the event
            -- Ok if it's negative, but if event has not yet started it would exceed the actual duration
            LEAST(NEW."durationSeconds", (EXTRACT (EPOCH FROM (NEW."startTime" - NOW()))) + NEW."durationSeconds")
        ) THEN
            RAISE EXCEPTION 'Quota limit reached (total streaming event minutes)';
        END IF;
        
        IF (
            NOT (OLD."intendedRoomModeName" = 'LIVESTREAM')
            OR OLD."roomId" != NEW."roomId"
        ) THEN
            -- Rooms are either streaming rooms or non-streaming rooms
            IF (EXISTS (
                    SELECT 1
                    FROM "schedule"."Event" as event1
                    WHERE event1."roomId" = NEW."roomId"
                    AND NOT (event1."intendedRoomModeName" = 'LIVESTREAM')
                    AND event1.id != OLD.id
                )) THEN
                RAISE EXCEPTION 'Room is a non-streaming program room.';
            END IF;
            
            IF (
                -- Not already a program room
                NOT EXISTS (
                    SELECT 1
                    FROM "schedule"."Event" as event1
                    WHERE event1."roomId" = NEW."roomId"
                )
                -- And streaming program room quota limit reached
                AND (SELECT "remainingStreamingProgramRooms" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0
            )
            THEN
                RAISE EXCEPTION 'Quota limit reached (streaming program rooms)';
            END IF;
        END IF;
    ELSEIF (NEW."intendedRoomModeName" = 'VIDEO_CHAT') THEN
        IF (OLD."intendedRoomModeName" != 'VIDEO_CHAT') THEN
            IF NOT (SELECT "areVideoChatEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
                RAISE EXCEPTION 'Quota limit reached (video-chat events not included)';
            END IF;
        END IF;

        IF (SELECT "maxVideoChatEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < NEW."durationSeconds" THEN
            RAISE EXCEPTION 'Quota limit reached (video-chat event duration)';
        END IF;
        
        IF (GREATEST(0, LEAST(OLD."durationSeconds", (EXTRACT (EPOCH FROM (OLD."startTime" - NOW()))) + OLD."durationSeconds"))
            + ((SELECT "remainingVideoChatEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60)
            < 
            LEAST(NEW."durationSeconds", (EXTRACT (EPOCH FROM (NEW."startTime" - NOW()))) + NEW."durationSeconds")
        ) THEN
            RAISE EXCEPTION 'Quota limit reached (total video-chat event minutes)';
        END IF;
        
        IF (
            OLD."intendedRoomModeName" != 'VIDEO_CHAT'
            OR OLD."roomId" != NEW."roomId"
        ) THEN
            -- Rooms are either streaming rooms or non-streaming rooms
            IF (EXISTS (
                    SELECT 1
                    FROM "schedule"."Event" as event1
                    WHERE event1."roomId" = NEW."roomId"
                    AND event1."intendedRoomModeName" = 'LIVESTREAM'
                    AND event1.id != OLD.id
                )) THEN
                RAISE EXCEPTION 'Room is a streaming program room.';
            END IF;
            
            IF (
                -- Not already a program room
                NOT EXISTS (
                    SELECT 1
                    FROM "schedule"."Event" as event1
                    WHERE event1."roomId" = NEW."roomId"
                )
                -- And non-streaming program room quota limit reached
                AND (SELECT "remainingNonStreamingProgramRooms" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0
            )
            THEN
                RAISE EXCEPTION 'Quota limit reached (non-streaming program rooms)';
            END IF;
        END IF;
    ELSEIF (
        OLD."intendedRoomModeName" = 'LIVESTREAM'
        OR OLD."intendedRoomModeName" = 'VIDEO_CHAT'
        OR OLD."roomId" != NEW."roomId"
    ) THEN
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."intendedRoomModeName" = 'LIVESTREAM'
                AND event1.id != OLD.id
            )) THEN
            RAISE EXCEPTION 'Room is a streaming program room.';
        END IF;
        
        IF (
            -- Not already a program room
            NOT EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
            )
            -- And non-streaming program room quota limit reached
            AND (SELECT "remainingNonStreamingProgramRooms" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0
        )
        THEN
            RAISE EXCEPTION 'Quota limit reached (non-streaming program rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION room."IsStreamingProgramRoom"(i_row room."Room")
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT EXISTS (
        SELECT 1
        FROM "schedule"."Event" as event
        WHERE event."roomId" = i_row."id" 
        AND event."intendedRoomModeName" = 'LIVESTREAM'
    )
$function$;
