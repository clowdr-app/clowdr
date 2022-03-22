DROP VIEW IF EXISTS "schedule"."OverlappingEvents";
DROP VIEW IF EXISTS "schedule"."CurrentEvents";
DROP VIEW IF EXISTS room."LivestreamDurations";
DROP VIEW IF EXISTS conference."RemainingQuota";

CREATE OR REPLACE FUNCTION "schedule"."checkInsertEvent"()
  RETURNS trigger AS
$func$
BEGIN
    RETURN NEW;
END
$func$ LANGUAGE plpgsql;

ALTER TABLE "schedule"."Event" DISABLE TRIGGER ALL;

CREATE OR REPLACE FUNCTION schedule."checkUpdateEvent"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
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
        AND event."modeName" = 'LIVESTREAM'
    )
$function$;


ALTER TABLE schedule."Event"
    DROP COLUMN IF EXISTS "endTime";

ALTER TABLE schedule."Event"
    ADD COLUMN "scheduledEndTime" timestamptz NOT NULL DEFAULT now();

UPDATE schedule."Event"
    SET "scheduledEndTime" = "scheduledStartTime" + ("durationSeconds" * (interval '1 second'));

DROP TRIGGER IF EXISTS "set_schedule_Event_timings_updated_at" on "schedule"."Event";

ALTER TABLE schedule."Event"
    DROP COLUMN "durationSeconds";

CREATE TRIGGER "set_schedule_Event_timings_updated_at"
    BEFORE UPDATE OF "scheduledStartTime", "scheduledEndTime"
    ON schedule."Event"
    FOR EACH ROW
    EXECUTE PROCEDURE schedule.set_current_timestamp_timings_updated_at();

COMMENT ON TRIGGER "set_schedule_Event_timings_updated_at" ON schedule."Event"
    IS 'trigger to set value of column "timings_updated_at" to current timestamp on row scheduledStartTime or scheduledEndTime update';

CREATE OR REPLACE VIEW "conference"."RemainingQuota" AS 
 SELECT conf.id AS "conferenceId",
    conf.slug,
    (quota."maxSubconferences" - ( SELECT count(*) AS count
           FROM conference."Subconference" subconf
          WHERE (subconf."conferenceId" = conf.id))) AS "remainingSubconferences",
    ((quota."maxStreamingEventTotalMinutes"
		- usage."consumedStreamingEventTotalMinutes") 
		- COALESCE(
		(
			SELECT (round(((sum(GREATEST(0, LEAST(
				EXTRACT(EPOCH FROM event4."scheduledEndTime" - event4."scheduledStartTime"),
				EXTRACT(EPOCH FROM event4."scheduledEndTime" - now())
			))) / 60))::double precision))::integer AS round
			FROM schedule."Event" event4
			WHERE ((event4."conferenceId" = conf.id) AND (event4."modeName" = 'LIVESTREAM'))
		)
		, 0)
	) AS "remainingStreamingEventTotalMinutes",
    ((quota."maxVideoChatEventTotalMinutes" 
		- usage."consumedVideoChatEventTotalMinutes") 
		- COALESCE(
		(
			SELECT (round(((sum(GREATEST(0, LEAST(
				EXTRACT(EPOCH FROM event4."scheduledEndTime" - event4."scheduledStartTime"),
				EXTRACT(EPOCH FROM event4."scheduledEndTime" - now())
			))) / 60))::double precision))::integer AS round
			FROM schedule."Event" event4
			WHERE ((event4."conferenceId" = conf.id) AND (event4."modeName" = 'VIDEO_CHAT'::text))
		)
		, 0)
	) AS "remainingVideoChatEventTotalMinutes",
    (quota."maxRegistrants" - ( SELECT count(*) AS count
           FROM registrant."Registrant" subconf
          WHERE (subconf."conferenceId" = conf.id))) AS "remainingRegistrants",
    (quota."maxVideoChatNonEventTotalMinutesConsumed" - usage."consumedVideoChatNonEventTotalMinutes") AS "remainingVideoChatNonEventTotalMinutes",
    (quota."maxSupportMeetingMinutes" - usage."consumedSupportMeetingMinutes") AS "remainingSupportMeetingMinutes",
    (quota."maxStreamingProgramRooms" - ( SELECT count(*) AS count
           FROM room."Room" room1
          WHERE ((room1."conferenceId" = conf.id) AND (EXISTS ( SELECT 1
                   FROM schedule."Event" event1
                  WHERE ((event1."roomId" = room1.id) AND (event1."modeName" = 'LIVESTREAM'))))))) AS "remainingStreamingProgramRooms",
    (quota."maxNonStreamingProgramRooms" - ( SELECT count(*) AS count
           FROM room."Room" room2
          WHERE ((room2."conferenceId" = conf.id) AND (EXISTS ( SELECT 1
                   FROM schedule."Event" event2
                  WHERE ((event2."roomId" = room2.id) AND (NOT (event2."modeName" = 'LIVESTREAM')))))))) AS "remainingNonStreamingProgramRooms",
    (quota."maxPublicSocialRooms" - ( SELECT count(*) AS count
           FROM room."Room" room3
          WHERE ((room3."conferenceId" = conf.id) AND (room3."managementModeName" = 'PUBLIC'::text) AND (room3."itemId" IS NULL) AND (NOT (EXISTS ( SELECT 1
                   FROM schedule."Event" event3
                  WHERE (event3."roomId" = room3.id))))))) AS "remainingPublicSocialRooms",
    (quota."maxContentItems" - ( SELECT count(*) AS count
           FROM content."Item" item1
          WHERE (item1."conferenceId" = conf.id AND item1."typeName" != 'SPONSOR'))) AS "remainingContentItems"
   FROM ((conference."Conference" conf
     LEFT JOIN conference."Quota" quota ON ((quota."conferenceId" = conf.id)))
     LEFT JOIN conference."Usage" usage ON ((usage."conferenceId" = conf.id)));


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
                                    EXTRACT(EPOCH FROM event."scheduledEndTime" - event."scheduledStartTime")
                                    ,
                                    LEAST(
                                        -- time between last update and end of event
                                        EXTRACT(EPOCH FROM event."scheduledEndTime" - usage."lastUpdatedConsumedStreamingEventTotalMinutes")
                                        ,
                                        -- time between start of event and now
                                        EXTRACT(EPOCH FROM now() - event."scheduledStartTime")
                                    )
                                )
                            ))
                        )
                        FROM "schedule"."Event" as event
                        WHERE usage."conferenceId" = event."conferenceId"
                        AND event."modeName" = 'LIVESTREAM'
                        AND event."scheduledStartTime" < now()
                        AND event."scheduledEndTime" >= usage."lastUpdatedConsumedStreamingEventTotalMinutes"
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
                                    EXTRACT(EPOCH FROM event."scheduledEndTime" - event."scheduledStartTime")
                                    ,
                                    LEAST(
                                        -- time between last update and end of event
                                        EXTRACT(EPOCH FROM event."scheduledEndTime" - usage."lastUpdatedConsumedVideoChatEventTotalMinutes")
                                        ,
                                        -- time between start of event and now
                                        EXTRACT(EPOCH FROM now() - event."scheduledStartTime")
                                    )
                                )
                            ))
                        )
                        FROM "schedule"."Event" as event
                        WHERE usage."conferenceId" = event."conferenceId"
                        AND event."modeName" = 'VIDEO_CHAT'
                        AND event."scheduledStartTime" < now()
                        AND event."scheduledEndTime" >= usage."lastUpdatedConsumedVideoChatEventTotalMinutes"
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
    IF (NEW."modeName" = 'LIVESTREAM') THEN
        IF NOT (SELECT "areStreamingEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
            RAISE EXCEPTION 'Quota limit reached (streaming events not included)';
        END IF;

        IF (SELECT "maxStreamingEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
			EXTRACT(EPOCH FROM NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION 'Quota limit reached (streaming event duration)';
        END IF;
        
        IF (SELECT "remainingStreamingEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION 'Quota limit reached (total streaming event minutes)';
        END IF;
        
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND NOT (event1."modeName" = 'LIVESTREAM')
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
    ELSEIF (NEW."modeName" = 'VIDEO_CHAT') THEN
        IF NOT (SELECT "areVideoChatEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
            RAISE EXCEPTION 'Quota limit reached (video-chat events not included)';
        END IF;

        IF (SELECT "maxVideoChatEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION 'Quota limit reached (video-chat event duration)';
        END IF;
        
        IF (SELECT "remainingVideoChatEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION 'Quota limit reached (total video-chat event minutes)';
        END IF;
        
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."modeName" = 'LIVESTREAM'
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
                AND event1."modeName" = 'LIVESTREAM'
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
        AND OLD."scheduledStartTime" = NEW."scheduledStartTime"
        AND OLD."scheduledEndTime" = NEW."scheduledEndTime"
        AND OLD."modeName" = NEW."modeName") THEN
        RETURN NEW;
    END IF;

    IF (NEW."modeName" = 'LIVESTREAM') THEN
        IF (NOT (OLD."modeName" = 'LIVESTREAM')) THEN
            IF NOT (SELECT "areStreamingEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
                RAISE EXCEPTION 'Quota limit reached (streaming events not included)';
            END IF;
        END IF;

        IF (SELECT "maxStreamingEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION 'Quota limit reached (streaming event duration)';
        END IF;
        
        IF (GREATEST(0, 
				LEAST(EXTRACT(EPOCH FROM OLD."scheduledEndTime" - old."scheduledStartTime"), 
					  EXTRACT (EPOCH FROM OLD."scheduledEndTime" - NOW()))
			)
            + ((SELECT "remainingStreamingEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60)
            <
            LEAST(EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime"), 
			      EXTRACT (EPOCH FROM NEW."scheduledEndTime" - NOW()))
        ) THEN
            RAISE EXCEPTION 'Quota limit reached (total streaming event minutes)';
        END IF;
        
        IF (
            NOT (OLD."modeName" = 'LIVESTREAM')
            OR OLD."roomId" != NEW."roomId"
        ) THEN
            -- Rooms are either streaming rooms or non-streaming rooms
            IF (EXISTS (
                    SELECT 1
                    FROM "schedule"."Event" as event1
                    WHERE event1."roomId" = NEW."roomId"
                    AND NOT (event1."modeName" = 'LIVESTREAM')
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
    ELSEIF (NEW."modeName" = 'VIDEO_CHAT') THEN
        IF (OLD."modeName" != 'VIDEO_CHAT') THEN
            IF NOT (SELECT "areVideoChatEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
                RAISE EXCEPTION 'Quota limit reached (video-chat events not included)';
            END IF;
        END IF;

        IF (SELECT "maxVideoChatEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
			EXTRACT (EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION 'Quota limit reached (video-chat event duration)';
        END IF;
        
        IF (GREATEST(0, 
				LEAST(EXTRACT(EPOCH FROM OLD."scheduledEndTime" - OLD."scheduledStartTime"), 
					  EXTRACT (EPOCH FROM OLD."scheduledEndTime" - NOW()))
			)
            + ((SELECT "remainingVideoChatEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60)
            < 
            LEAST(EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime"), 
			      EXTRACT (EPOCH FROM NEW."scheduledEndTime" - NOW()))
        ) THEN
            RAISE EXCEPTION 'Quota limit reached (total video-chat event minutes)';
        END IF;
        
        IF (
            OLD."modeName" != 'VIDEO_CHAT'
            OR OLD."roomId" != NEW."roomId"
        ) THEN
            -- Rooms are either streaming rooms or non-streaming rooms
            IF (EXISTS (
                    SELECT 1
                    FROM "schedule"."Event" as event1
                    WHERE event1."roomId" = NEW."roomId"
                    AND event1."modeName" = 'LIVESTREAM'
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
        OLD."modeName" = 'LIVESTREAM'
        OR OLD."modeName" = 'VIDEO_CHAT'
        OR OLD."roomId" != NEW."roomId"
    ) THEN
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."modeName" = 'LIVESTREAM'
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
        AND event."modeName" = 'LIVESTREAM'
    )
$function$;

ALTER TABLE "schedule"."Event" ENABLE TRIGGER ALL;

CREATE
OR REPLACE VIEW "room"."LivestreamDurations" AS
SELECT
  "Event"."conferenceId",
  "Event"."roomId",
  sum(EXTRACT(EPOCH FROM "Event"."scheduledEndTime" - "Event"."scheduledStartTime")) AS sum,
  "Event"."subconferenceId"
FROM
  schedule."Event"
WHERE "Event"."modeName" = 'LIVESTREAM'
GROUP BY
  "Event"."conferenceId",
  "Event"."subconferenceId",
  "Event"."roomId";


CREATE OR REPLACE VIEW "schedule"."OverlappingEvents" AS
SELECT
  rowa."conferenceId",
  rowa.id AS "xId",
  rowb.id AS "yId",
  rowa."subconferenceId"
FROM schedule."Event" rowa
JOIN schedule."Event" rowb 
ON (rowa."roomId" = rowb."roomId")
AND (rowa.id <> rowb.id)
AND (rowa."scheduledStartTime" < rowb."scheduledEndTime")
AND (rowa."scheduledEndTime" > rowb."scheduledStartTime");
  
  
CREATE OR REPLACE VIEW "schedule"."CurrentEvents" AS
SELECT * FROM schedule."Event" event
WHERE (event."scheduledStartTime" <= now())
AND (event."scheduledEndTime" >= now());
