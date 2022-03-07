CREATE OR REPLACE VIEW "conference"."RemainingQuota" AS 
 SELECT conf.id AS "conferenceId",
    conf.slug,
    (quota."maxSubconferences" - ( SELECT count(*) AS count
           FROM conference."Subconference" subconf
          WHERE (subconf."conferenceId" = conf.id))) AS "remainingSubconferences",
    (quota."maxStreamingEventTotalMinutes" 
        - usage."consumedStreamingEventTotalMinutes"
        - (
            -- LEAST(Duration, Duration + (StartTime - Now))
            -- (Start Time + Duration) = End Time
            -- End Time - Now = Time remaining in the event (minimum 0)
            SELECT CAST(ROUND(SUM(GREATEST(0, LEAST(event4."durationSeconds", CAST(event4."durationSeconds" + EXTRACT(EPOCH FROM (event4."startTime" - NOW())) AS Integer)))) / 60) as Integer)
            FROM "schedule"."Event" as event4
            WHERE event4."conferenceId" = conf.id
            AND event4."intendedRoomModeName" = ANY('{PRERECORDED,PRESENTATION,Q_AND_A}')
        )
    ) AS "remainingStreamingEventTotalMinutes",
    (quota."maxVideoChatEventTotalMinutes" 
        - usage."consumedVideoChatEventTotalMinutes"
        - (
            -- (Start Time + Duration) = End Time
            -- End Time - Now = Time remaining in the event (minimum 0)
            SELECT CAST(ROUND(SUM(GREATEST(0, LEAST(event4."durationSeconds", CAST(event4."durationSeconds" + EXTRACT(EPOCH FROM (event4."startTime" - NOW())) AS Integer)))) / 60) AS Integer)
            FROM "schedule"."Event" as event4
            WHERE event4."conferenceId" = conf.id
            AND event4."intendedRoomModeName" = 'VIDEO_CHAT'
        )
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
                  WHERE ((event1."roomId" = room1.id) AND (event1."intendedRoomModeName" = ANY ('{PRERECORDED,PRESENTATION,Q_AND_A}'::text[])))))))) AS "remainingStreamingProgramRooms",
    (quota."maxNonStreamingProgramRooms" - ( SELECT count(*) AS count
           FROM room."Room" room2
          WHERE ((room2."conferenceId" = conf.id) AND (EXISTS ( SELECT 1
                   FROM schedule."Event" event2
                  WHERE ((event2."roomId" = room2.id) AND (NOT (event2."intendedRoomModeName" = ANY ('{PRERECORDED,PRESENTATION,Q_AND_A}'::text[]))))))))) AS "remainingNonStreamingProgramRooms",
    (quota."maxPublicSocialRooms" - ( SELECT count(*) AS count
           FROM room."Room" room3
          WHERE ((room3."conferenceId" = conf.id) AND (room3."managementModeName" = 'PUBLIC'::text) AND (room3."itemId" IS NULL) AND (NOT (EXISTS ( SELECT 1
                   FROM schedule."Event" event3
                  WHERE (event3."roomId" = room3.id))))))) AS "remainingPublicSocialRooms",
    (quota."maxContentItems" - ( SELECT count(*) AS count
           FROM content."Item" item1
          WHERE (item1."conferenceId" = conf.id))) AS "remainingContentItems"
   FROM ((conference."Conference" conf
     LEFT JOIN conference."Quota" quota ON ((quota."conferenceId" = conf.id)))
     LEFT JOIN conference."Usage" usage ON ((usage."conferenceId" = conf.id)));





CREATE FUNCTION "conference"."checkInsertSubconference"()
  RETURNS trigger AS
$func$
BEGIN
   IF (SELECT "remainingSubconferences" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
      RAISE EXCEPTION 'Quota limit reached';
   END IF;
   RETURN NEW;
END
$func$  LANGUAGE plpgsql;

CREATE TRIGGER "checkQuota"
BEFORE INSERT ON "conference"."Subconference"
FOR EACH ROW EXECUTE PROCEDURE "conference"."checkInsertSubconference"();





CREATE FUNCTION "registrant"."checkInsertRegistrant"()
  RETURNS trigger AS
$func$
BEGIN
   IF (SELECT "remainingRegistrants" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
      RAISE EXCEPTION 'Quota limit reached';
   END IF;
   RETURN NEW;
END
$func$  LANGUAGE plpgsql;

CREATE TRIGGER "checkQuota"
BEFORE INSERT ON "registrant"."Registrant"
FOR EACH ROW EXECUTE PROCEDURE "registrant"."checkInsertRegistrant"();





CREATE OR REPLACE FUNCTION "schedule"."checkInsertEvent"()
  RETURNS trigger AS
$func$
BEGIN
    IF (NEW."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')) THEN
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
                AND NOT (event1."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}'))
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
                AND event1."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')
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
                AND event1."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')
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

CREATE TRIGGER "checkQuotaOnInsert"
BEFORE INSERT ON "schedule"."Event"
FOR EACH ROW EXECUTE PROCEDURE "schedule"."checkInsertEvent"();








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

    IF (NEW."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')) THEN
        IF (NOT (OLD."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}'))) THEN
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
            NOT (OLD."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}'))
            OR OLD."roomId" != NEW."roomId"
        ) THEN
            -- Rooms are either streaming rooms or non-streaming rooms
            IF (EXISTS (
                    SELECT 1
                    FROM "schedule"."Event" as event1
                    WHERE event1."roomId" = NEW."roomId"
                    AND NOT (event1."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}'))
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
                    AND event1."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')
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
        OLD."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}') 
        OR OLD."intendedRoomModeName" = 'VIDEO_CHAT'
        OR OLD."roomId" != NEW."roomId"
    ) THEN
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."intendedRoomModeName" = ANY('{"PRERECORDED", "PRESENTATION", "Q_AND_A"}')
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

CREATE TRIGGER "checkQuotaOnUpdate"
BEFORE UPDATE ON "schedule"."Event"
FOR EACH ROW EXECUTE PROCEDURE "schedule"."checkUpdateEvent"();











CREATE OR REPLACE FUNCTION room."checkInsertRoom"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW."managementModeName" = 'PUBLIC' THEN
        IF (
            SELECT "remainingStreamingProgramRooms" + "remainingNonStreamingProgramRooms" + "remainingPublicSocialRooms" 
            FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") 
            <= 0
        THEN
            RAISE EXCEPTION 'Quota limit reached (total public rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$function$;

CREATE TRIGGER "checkQuotaOnInsert"
BEFORE INSERT ON "room"."Room"
FOR EACH ROW EXECUTE PROCEDURE "room"."checkInsertRoom"();

CREATE OR REPLACE FUNCTION room."checkUpdateRoom"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD."managementModeName" != 'PUBLIC' AND NEW."managementModeName" = 'PUBLIC' THEN
        IF (
            SELECT "remainingStreamingProgramRooms" + "remainingNonStreamingProgramRooms" + "remainingPublicSocialRooms" 
            FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") 
            <= 0
        THEN
            RAISE EXCEPTION 'Quota limit reached (total public rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$function$;

CREATE TRIGGER "checkQuotaOnUpdate"
BEFORE UPDATE ON "room"."Room"
FOR EACH ROW EXECUTE PROCEDURE "room"."checkUpdateRoom"();









CREATE OR REPLACE FUNCTION content."checkInsertItem"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW."typeName" != 'SPONSOR' THEN
        IF (SELECT "remainingContentItems" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
            RAISE EXCEPTION 'Quota limit reached (total content items)';
        END IF;
    END IF;

    RETURN NEW;
END
$function$;

CREATE TRIGGER "checkQuotaOnInsert"
BEFORE INSERT ON "content"."Item"
FOR EACH ROW EXECUTE PROCEDURE "content"."checkInsertItem"();

CREATE OR REPLACE FUNCTION content."checkUpdateItem"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD."typeName" = 'SPONSOR' AND NEW."typeName" != 'SPONSOR' THEN
        IF (SELECT "remainingContentItems" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
            RAISE EXCEPTION 'Quota limit reached (total public contents)';
        END IF;
    END IF;

    RETURN NEW;
END
$function$;

CREATE TRIGGER "checkQuotaOnUpdate"
BEFORE UPDATE ON "content"."Item"
FOR EACH ROW EXECUTE PROCEDURE "content"."checkUpdateItem"();







CREATE OR REPLACE FUNCTION content."checkInsertElement"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW."source" = '"EVENT_RECORDING"' OR NEW."source" = '"COMBINE_VIDEOS"' THEN
        RETURN NEW;
    END IF;

    IF (SELECT "typeName" FROM "content"."Item" as item WHERE item.id = NEW."itemId") != 'SPONSOR' THEN
        IF NEW."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}') THEN
            IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
             >= (SELECT "maxMediaElementsPerContentItem" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
            THEN
                RAISE EXCEPTION 'Quota limit reached (media elements per item)';
            END IF;
        ELSE
            IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND NOT (el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}')))
             >= (SELECT "maxNonMediaElementsPerContentItem" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
            THEN
                RAISE EXCEPTION 'Quota limit reached (non-media elements per item)';
            END IF;
        END IF;
    ELSE
        IF NEW."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}') THEN
            IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
             >= (SELECT "maxMediaElementsPerSponsor" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
            THEN
                RAISE EXCEPTION 'Quota limit reached (media elements per sponsor)';
            END IF;
        ELSE
            IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND NOT (el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}')))
             >= (SELECT "maxNonMediaElementsPerSponsor" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
            THEN
                RAISE EXCEPTION 'Quota limit reached (non-media elements per sponsor)';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END
$function$;

CREATE TRIGGER "checkQuotaOnInsert"
BEFORE INSERT ON "content"."Element"
FOR EACH ROW EXECUTE PROCEDURE "content"."checkInsertElement"();

CREATE OR REPLACE FUNCTION content."checkUpdateElement"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW."source" = '"EVENT_RECORDING"' OR NEW."source" = '"COMBINE_VIDEOS"' THEN
        RETURN NEW;
    END IF;

    IF  (   (NEW."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
            AND NOT (OLD."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
        )
        OR ((NOT (NEW."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}')))
            AND (OLD."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
        )
        OR NEW."itemId" != OLD."itemId"
    THEN
        IF (SELECT "typeName" FROM "content"."Item" as item WHERE item.id = NEW."itemId") != 'SPONSOR' THEN
            IF NEW."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}') THEN
                IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
                 >= (SELECT "maxMediaElementsPerContentItem" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
                THEN
                    RAISE EXCEPTION 'Quota limit reached (media elements per item)';
                END IF;
            ELSE
                IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND NOT (el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}')))
                 >= (SELECT "maxNonMediaElementsPerContentItem" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
                THEN
                    RAISE EXCEPTION 'Quota limit reached (non-media elements per item)';
                END IF;
            END IF;
        ELSE
            IF NEW."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}') THEN
                IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
                 >= (SELECT "maxMediaElementsPerSponsor" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
                THEN
                    RAISE EXCEPTION 'Quota limit reached (media elements per sponsor)';
                END IF;
            ELSE
                IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND NOT (el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}')))
                 >= (SELECT "maxNonMediaElementsPerSponsor" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
                THEN
                    RAISE EXCEPTION 'Quota limit reached (non-media elements per sponsor)';
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END
$function$;


CREATE TRIGGER "checkQuotaOnUpdate"
BEFORE UPDATE ON "content"."Element"
FOR EACH ROW EXECUTE PROCEDURE "content"."checkUpdateElement"();
