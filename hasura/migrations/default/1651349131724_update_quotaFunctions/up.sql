CREATE OR REPLACE FUNCTION conference."checkInsertSubconference"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   IF (SELECT "remainingSubconferences" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
      RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached';
   END IF;
   RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION content."checkInsertItem"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF NEW."typeName" != 'SPONSOR' THEN
        IF (SELECT "remainingContentItems" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total content items)';
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION content."checkUpdateElement"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
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
                    RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (media elements per item)';
                END IF;
            ELSE
                IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND NOT (el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}')))
                 >= (SELECT "maxNonMediaElementsPerContentItem" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
                THEN
                    RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (non-media elements per item)';
                END IF;
            END IF;
        ELSE
            IF NEW."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}') THEN
                IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}'))
                 >= (SELECT "maxMediaElementsPerSponsor" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
                THEN
                    RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (media elements per sponsor)';
                END IF;
            ELSE
                IF (SELECT COUNT(*) FROM "content"."Element" as el WHERE el."itemId" = NEW."itemId" AND NOT (el."typeName" = ANY('{"VIDEO_FILE","VIDEO_BROADCAST","VIDEO_PREPUBLISH","VIDEO_TITLES","VIDEO_SPONSORS_FILLER","VIDEO_FILLER","VIDEO_COUNTDOWN","AUDIO_FILE"}')))
                 >= (SELECT "maxNonMediaElementsPerSponsor" FROM "conference"."Quota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId")
                THEN
                    RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (non-media elements per sponsor)';
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION content."checkUpdateItem"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF OLD."typeName" = 'SPONSOR' AND NEW."typeName" != 'SPONSOR' THEN
        IF (SELECT "remainingContentItems" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total public contents)';
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION registrant."checkInsertRegistrant"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
   IF (SELECT "remainingRegistrants" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
      RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached';
   END IF;
   RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION room."checkInsertRoom"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF NEW."managementModeName" = 'PUBLIC' THEN
        IF (
            SELECT "remainingStreamingProgramRooms" + "remainingNonStreamingProgramRooms" + "remainingPublicSocialRooms" 
            FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") 
            <= 0
        THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total public rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION room."checkUpdateRoom"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF OLD."managementModeName" != 'PUBLIC' AND NEW."managementModeName" = 'PUBLIC' THEN
        IF (
            SELECT "remainingStreamingProgramRooms" + "remainingNonStreamingProgramRooms" + "remainingPublicSocialRooms" 
            FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") 
            <= 0
        THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total public rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION schedule."checkInsertEvent"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF (NEW."modeName" = 'LIVESTREAM') THEN
        IF NOT (SELECT "areStreamingEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (streaming events not included)';
        END IF;

        IF (SELECT "maxStreamingEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
			EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (streaming event duration)';
        END IF;
        
        IF (SELECT "remainingStreamingEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total streaming event minutes)';
        END IF;
        
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND NOT (event1."modeName" = 'LIVESTREAM')
            )) THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Room is a non-streaming program room.';
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
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (streaming program rooms)';
        END IF;
    ELSEIF (NEW."modeName" = 'VIDEO_CHAT') THEN
        IF NOT (SELECT "areVideoChatEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (video-chat events not included)';
        END IF;

        IF (SELECT "maxVideoChatEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (video-chat event duration)';
        END IF;
        
        IF (SELECT "remainingVideoChatEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total video-chat event minutes)';
        END IF;
        
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."modeName" = 'LIVESTREAM'
            )) THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Room is a streaming program room.';
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
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (non-streaming program rooms)';
        END IF;
    ELSEIF (NOT (NEW."modeName" IS NULL)) THEN
        -- Rooms are either streaming rooms or non-streaming rooms
        IF (EXISTS (
                SELECT 1
                FROM "schedule"."Event" as event1
                WHERE event1."roomId" = NEW."roomId"
                AND event1."modeName" = 'LIVESTREAM'
            )) THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Room is a streaming program room.';
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
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (non-streaming program rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;

CREATE OR REPLACE FUNCTION schedule."checkUpdateEvent"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF ((OLD."roomId" = NEW."roomId"
        AND OLD."scheduledStartTime" = NEW."scheduledStartTime"
        AND OLD."scheduledEndTime" = NEW."scheduledEndTime"
        AND OLD."modeName" = NEW."modeName")
        OR NEW."modeName" IS NULL
    ) THEN
        RETURN NEW;
    END IF;

    IF (NEW."modeName" = 'LIVESTREAM') THEN
        IF (NOT (OLD."modeName" = 'LIVESTREAM')) THEN
            IF NOT (SELECT "areStreamingEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
                RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (streaming events not included)';
            END IF;
        END IF;

        IF (SELECT "maxStreamingEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
		   EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (streaming event duration)';
        END IF;
        
        IF (GREATEST(0, 
				LEAST(EXTRACT(EPOCH FROM OLD."scheduledEndTime" - old."scheduledStartTime"), 
					  EXTRACT(EPOCH FROM OLD."scheduledEndTime" - NOW()))
			)
            + ((SELECT "remainingStreamingEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60)
            <
            LEAST(EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime"), 
			      EXTRACT (EPOCH FROM NEW."scheduledEndTime" - NOW()))
        ) THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total streaming event minutes)';
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
                RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Room is a non-streaming program room.';
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
                RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (streaming program rooms)';
            END IF;
        END IF;
    ELSEIF (NEW."modeName" = 'VIDEO_CHAT') THEN
        IF (OLD."modeName" != 'VIDEO_CHAT') THEN
            IF NOT (SELECT "areVideoChatEventsAllowed" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") THEN
                RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (video-chat events not included)';
            END IF;
        END IF;

        IF (SELECT "maxVideoChatEventIndividualMinutes" FROM "conference"."Quota" as quota WHERE quota."conferenceId" = NEW."conferenceId") * 60 < 
			EXTRACT (EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime")
		THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (video-chat event duration)';
        END IF;
        
        IF (GREATEST(0, 
				LEAST(EXTRACT(EPOCH FROM OLD."scheduledEndTime" - OLD."scheduledStartTime"), 
					  EXTRACT(EPOCH FROM OLD."scheduledEndTime" - NOW()))
			)
            + ((SELECT "remainingVideoChatEventTotalMinutes" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") * 60)
            < 
            LEAST(EXTRACT(EPOCH FROM NEW."scheduledEndTime" - NEW."scheduledStartTime"), 
			      EXTRACT (EPOCH FROM NEW."scheduledEndTime" - NOW()))
        ) THEN
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (total video-chat event minutes)';
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
                RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Room is a streaming program room.';
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
                RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (non-streaming program rooms)';
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
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Room is a streaming program room.';
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
            RAISE EXCEPTION USING ERRCODE = '22000', MESSAGE = 'Quota limit reached (non-streaming program rooms)';
        END IF;
    END IF;

    RETURN NEW;
END
$BODY$;