ALTER TABLE "room"."ChimeMeeting"
    RENAME CONSTRAINT "RoomChimeMeeting_roomId_fkey" to "ChimeMeeting_roomId_fkey";
ALTER TABLE "room"."ChimeMeeting"
    RENAME CONSTRAINT "RoomChimeMeeting_pkey" to "ChimeMeeting_pkey";
ALTER TABLE "room"."ChimeMeeting"
    RENAME CONSTRAINT "RoomChimeMeeting_roomId_key" to "ChimeMeeting_roomId_key";

CREATE INDEX "room_ChimeMeeting_roomId" ON "room"."ChimeMeeting" ("roomId");
CREATE INDEX "room_ChimeMeeting_conferenceId" ON "room"."ChimeMeeting" ("conferenceId");
CREATE INDEX "room_ChimeMeeting_chimeMeetingId" ON "room"."ChimeMeeting" ("chimeMeetingId");

ALTER TRIGGER "set_room_RoomChimeMeeting_updated_at" ON "room"."ChimeMeeting"
    RENAME TO "set_room_ChimeMeeting_updated_at";


ALTER TABLE "room"."ManagementMode"
    RENAME CONSTRAINT "RoomPrivacy_pkey" to "ManagementMode_pkey";


ALTER TABLE "room"."Mode"
    RENAME CONSTRAINT "RoomMode_pkey" to "Mode_pkey";


ALTER TABLE "room"."Participant"
    RENAME CONSTRAINT "RoomParticipant_attendeeId_fkey" to "Participant_registrantId_fkey";
ALTER TABLE "room"."Participant"
    RENAME CONSTRAINT "RoomParticipant_conferenceId_fkey" to "Participant_conferenceId_fkey";
ALTER TABLE "room"."Participant"
    RENAME CONSTRAINT "RoomParticipant_roomId_fkey" to "Participant_roomId_fkey";
ALTER TABLE "room"."Participant"
    RENAME CONSTRAINT "RoomParticipant_pkey" to "Participant_pkey";
ALTER TABLE "room"."Participant"
    RENAME CONSTRAINT "RoomParticipant_roomId_attendeeId_key" to "Participant_roomId_registrantId_key";

ALTER INDEX "room"."roomparticipant_conference_id" RENAME TO "room_Participant_conferenceId";
ALTER INDEX "room"."roomparticipant_room_id" RENAME TO "room_Participant_roomId";
CREATE INDEX "room_Participant_registrantId" ON "room"."Participant" ("registrantId");

ALTER TRIGGER "set_public_RoomParticipant_updated_at" ON "room"."Participant"
    RENAME TO "set_room_Participant_updated_at";


ALTER TABLE "room"."PersonRole"
    RENAME CONSTRAINT "RoomPersonRole_pkey" to "PersonRole_pkey";


ALTER TABLE "room"."Room"
    RENAME CONSTRAINT "Room_originatingContentGroupId_fkey" to "Room_originatingItemId_fkey";
ALTER TABLE "room"."Room"
    RENAME CONSTRAINT "Room_roomPrivacyName_fkey" to "Room_managementModeName_fkey";
ALTER TABLE "room"."Room"
    RENAME CONSTRAINT "Room_videoRoomBackendName_fkey" to "Room_backendName_fkey";


CREATE OR REPLACE FUNCTION "chat"."canAccessChat"(IN i_registrantId uuid,IN i_chatId uuid)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    VOLATILE
    PARALLEL UNSAFE
AS $BODY$
DECLARE
    l_contentExists boolean;
    l_hasAccessToRoom boolean;
    l_matching_conferences boolean;
BEGIN
    l_contentExists := EXISTS (
        SELECT 1 FROM "content"."Item" 
        WHERE "content"."Item"."chatId" = i_chatId
    );

    l_hasAccessToRoom := EXISTS (
        SELECT 1 FROM "room"."Room" 
        WHERE "room"."Room"."chatId" = i_chatId 
          AND ( "room"."Room"."managementModeName" = 'PUBLIC'
             OR EXISTS (
                SELECT 1 FROM "room"."RoomPerson" 
                    WHERE "room"."RoomPerson"."roomId" = "room"."Room"."id" 
                    AND "room"."RoomPerson"."registrantId" = i_registrantId
                )
              )
    );
    
    l_matching_conferences := (
        SELECT ("registrant"."Registrant"."conferenceId" = "chat"."Chat"."conferenceId")
        FROM "registrant"."Registrant"
        INNER JOIN "chat"."Chat"
        ON "registrant"."Registrant"."id" = i_registrantId
        AND "chat"."Chat"."id" = i_chatId
    );

    RETURN l_matching_conferences AND (l_contentExists OR l_hasAccessToRoom);
END;
$BODY$;

CREATE OR REPLACE FUNCTION "chat"."deletePinsSubsForRoomPerson"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
    l_room record;
    l_chat record;
BEGIN
    SELECT "chatId" FROM "room"."Room" WHERE "room"."Room"."id" = OLD."roomId" INTO l_room;

    IF l_room."chatId" IS NOT NULL THEN
        IF NOT "chat"."canAccessChat"(OLD."registrantId", l_room."chatId") THEN
            DELETE FROM "chat"."Pin" 
                WHERE "chat"."Pin"."chatId" = l_room."chatId" 
                  AND "chat"."Pin"."registrantId" = OLD."registrantId";

            DELETE FROM "chat"."Subscription" 
                WHERE "chat"."Subscription"."chatId" = l_room."chatId" 
                  AND "chat"."Subscription"."registrantId" = OLD."registrantId";
        END IF;
    END IF;

    RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION "chat"."generateChat"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
    nid uuid;
    isDM boolean;
BEGIN
    IF NEW."chatId" IS NULL THEN
        isDM := false;
        IF TG_ARGV[0] = 'true' THEN
            /* Room */
            isDM := (NEW."managementModeName" = 'DM');
        END IF;

	    INSERT INTO chat."Chat" ("conferenceId","enableAutoSubscribe","enableAutoPin") VALUES (NEW."conferenceId", isDM, isDM) RETURNING "id" INTO nid;
        NEW."chatId" := nid;
    END IF;
	RETURN NEW;
END;
$BODY$;

DROP INDEX "room"."privacy";
DROP INDEX "room"."vonage_session_id";

ALTER INDEX "room"."room_chat_id" RENAME TO "room_Room_chatId";
ALTER INDEX "room"."room_conference_id" RENAME TO "room_Room_conferenceId";
ALTER INDEX "room"."room_originatingContentGroupId" RENAME TO "room_Room_originatingItemId";
ALTER INDEX "room"."room_originatingEventId" RENAME TO "room_Room_originatingEventId";
ALTER INDEX "room"."room_privacy" RENAME TO "room_Room_managementModeName";
ALTER INDEX "room"."room_vonage_session_id" RENAME TO "room_Room_vonageSessionId";

CREATE INDEX "room_Room_priority" ON "room"."Room" ("priority" ASC);


ALTER TRIGGER "delete_room_people" ON "room"."Room"
    RENAME TO "deleteRoomPeople";
ALTER TRIGGER "set_public_Room_updated_at" ON "room"."Room"
    RENAME TO "set_room_Room_updated_at";
ALTER TRIGGER "insertChat" ON "room"."Room"
    RENAME TO "generateChat";
    

DROP INDEX "room"."room_id";


ALTER INDEX "room"."ShufflePeriod_conferenceId" RENAME TO "room_ShufflePeriod_conferenceId";
ALTER INDEX "room"."ShufflePeriod_endAt" RENAME TO "room_ShufflePeriod_endAt";
ALTER INDEX "room"."ShufflePeriod_startAt" RENAME TO "room_ShufflePeriod_startAt";


ALTER TABLE "room"."ShuffleQueueEntry"
    RENAME CONSTRAINT "ShuffleQueueEntry_attendeeId_fkey" to "ShuffleQueueEntry_registrantId_fkey";


ALTER INDEX "room"."ShuffleQueueEntry_attendeeId" RENAME TO "room_ShuffleQueueEntry_registrantId";
ALTER INDEX "room"."ShuffleQueueEntry_shufflePeriodId" RENAME TO "room_ShuffleQueueEntry_shufflePeriodId";
ALTER INDEX "room"."index_room_shufflequeueentry_iswaiting" RENAME TO "room_ShuffleQueueEntry_isWaiting";
