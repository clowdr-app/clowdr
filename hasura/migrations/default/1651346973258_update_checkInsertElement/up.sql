CREATE OR REPLACE FUNCTION content."checkInsertElement"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
BEGIN
    IF NEW."source" = '"EVENT_RECORDING"' OR NEW."source" = '"COMBINE_VIDEOS"' THEN
        RETURN NEW;
    END IF;

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

    RETURN NEW;
END
$BODY$;