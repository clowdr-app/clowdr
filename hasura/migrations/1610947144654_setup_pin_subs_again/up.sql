-- A chat should be pinned for an attendee
-- IF:
--   They belong to the same conference
--
-- AND EITHER:
--   The user manually pinned it
--   The user is a member of the room, and the chat is set to mandatory pin
--   The room is public, and the chat is set to mandatory pin
--
-- ELSE: it should not be pinned.

-- Events:
--   [-] Attendee created
--   [-] Chat created
--   [-] RoomPerson created
--   [-] RoomPerson deleted
--   [-] Room.chatId updated
--   [-] ContentGroup.chatId updated
--   [-] Chat mandatory pin flag updated
--   [-] Chat auto pin flag updated

-- Other:
--   [-] Prevent unpinning if mandatory flag is on
--   [-] When auto-pin is toggled on, compute the "should add pins" in the fashion of "mandatory pin"


-----------------------------------------


CREATE OR REPLACE FUNCTION chat.attendee_has_access_to_chat(i_attendeeId uuid, i_chatId uuid)
    RETURNS boolean
    LANGUAGE PLPGSQL
    AS
$$
DECLARE
    l_room "Room";
    l_contentExists boolean;
    l_hasAccessToRoom boolean;
    l_matching_conferences boolean;
BEGIN
    l_contentExists := EXISTS (
        SELECT 1 FROM "ContentGroup" 
        WHERE "ContentGroup"."chatId" = i_chatId
        LIMIT 1
    );

    l_hasAccessToRoom := EXISTS (
        SELECT 1 FROM "Room" 
        WHERE "Room"."chatId" = i_chatId 
          AND ( "Room"."roomPrivacyName" = 'PUBLIC'
             OR EXISTS (SELECT 1 FROM "RoomPerson" WHERE "RoomPerson"."roomId" = "Room"."id" AND "RoomPerson"."attendeeId" = i_attendeeId LIMIT 1)
              )
        LIMIT 1
    );
    
    l_matching_conferences := (
        SELECT ("Attendee"."conferenceId" = "chat"."Chat"."conferenceId")
        FROM "Attendee"
        INNER JOIN "chat"."Chat"
        ON "Attendee"."id" = i_attendeeId
        AND "Chat"."id" = i_chatId
    );

    RETURN l_matching_conferences AND (l_contentExists OR l_hasAccessToRoom);
END;
$$;


-----------------------------------------

-- When an attendee is created, find all the auto- and mandatory-pin/sub chats and create entries
CREATE OR REPLACE FUNCTION chat.generate_pins_subs_for_new_attendee()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
BEGIN
    INSERT INTO "chat"."Pin"("chatId", "attendeeId","wasManuallyPinned")
        (   SELECT "chat"."Chat"."id", NEW."id", false
            FROM "chat"."Chat"
            WHERE "chat"."Chat"."conferenceId" = NEW."conferenceId"
                AND ("chat"."Chat"."enableAutoPin" OR "chat"."Chat"."enableMandatoryPin")
                AND chat.attendee_has_access_to_chat(NEW."id", "chat"."Chat"."id")
        )
        ON CONFLICT DO NOTHING;
            
    INSERT INTO "chat"."Subscription"("chatId", "attendeeId","wasManuallySubscribed")
        (   SELECT "chat"."Chat"."id", NEW."id", false
            FROM "chat"."Chat"
            WHERE "chat"."Chat"."conferenceId" = NEW."conferenceId"
                AND ("chat"."Chat"."enableAutoSubscribe" OR "chat"."Chat"."enableMandatorySubscribe")
                AND chat.attendee_has_access_to_chat(NEW."id", "chat"."Chat"."id")
        )
        ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS created_generate_pins_subs ON "Attendee";
CREATE TRIGGER created_generate_pins_subs AFTER INSERT ON "Attendee" FOR EACH ROW EXECUTE PROCEDURE chat.generate_pins_subs_for_new_attendee();


-----------------------------------------

DROP TRIGGER IF EXISTS generate_pins_subs on "ContentGroup";
DROP TRIGGER IF EXISTS generate_pins_subs on "Room";
DROP FUNCTION IF EXISTS chat.generate_pins_subs_for_new_contentGroup_chat;
DROP FUNCTION IF EXISTS chat.generate_pins_subs_for_new_room_chat;

-- When a chat is created check if auto/mandatory pin/sub is enabled
-- If so, insert pins as appropriate

CREATE OR REPLACE FUNCTION chat.generate_pins_subs_for_new_chat()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
DECLARE
BEGIN
    INSERT INTO "chat"."Pin"("chatId", "attendeeId","wasManuallyPinned")
        (   SELECT NEW."id", "Attendee"."id", false
            FROM "Attendee"
            WHERE "Attendee"."conferenceId" = NEW."conferenceId"
                AND (NEW."enableAutoPin" OR NEW."enableMandatoryPin")
                AND chat.attendee_has_access_to_chat("Attendee"."id", NEW."id")
        )
        ON CONFLICT DO NOTHING;

    INSERT INTO "chat"."Subscription"("chatId", "attendeeId","wasManuallySubscribed")
        (   SELECT NEW."id", "Attendee"."id", false
            FROM "Attendee"
            WHERE "Attendee"."conferenceId" = NEW."conferenceId"
                AND (NEW."enableAutoSubscribe" OR NEW."enableMandatorySubscribe")
                AND chat.attendee_has_access_to_chat("Attendee"."id", NEW."id")
        )
        ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_pins_subs on "chat"."Chat";
CREATE TRIGGER generate_pins_subs AFTER INSERT ON "chat"."Chat" FOR EACH ROW EXECUTE PROCEDURE chat.generate_pins_subs_for_new_chat();


-----------------------------------------

-- When a room person is created, add their pins/subs

CREATE OR REPLACE FUNCTION chat.generate_pins_subs_for_new_room_person()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
DECLARE
    l_chatId uuid;
    l_chat record;
BEGIN
    SELECT "chatId" FROM "Room" WHERE "Room"."id" = NEW."roomId" INTO l_chatId;

    IF l_chatId IS NOT NULL THEN
        SELECT "enableAutoPin", "enableMandatoryPin", "enableAutoSubscribe", "enableMandatorySubscribe" 
            FROM "chat"."Chat"
            WHERE "chat"."Chat"."id" = l_chatId 
            INTO l_chat;

        IF l_chat."enableAutoPin" OR l_chat."enableMandatoryPin" THEN
            INSERT INTO "chat"."Pin"("chatId", "attendeeId","wasManuallyPinned")
                VALUES (l_chatId, NEW."attendeeId", false)
                ON CONFLICT DO NOTHING;
        END IF;

        IF l_chat."enableAutoSubscribe" OR l_chat."enableMandatorySubscribe" THEN
            INSERT INTO "chat"."Subscription"("chatId", "attendeeId","wasManuallySubscribed")
                VALUES (l_chatId, NEW."attendeeId", false)
                ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS generate_pins_subs on "RoomPerson";
CREATE TRIGGER generate_pins_subs AFTER INSERT ON "RoomPerson" FOR EACH ROW EXECUTE PROCEDURE chat.generate_pins_subs_for_new_room_person();



-----------------------------------------



CREATE OR REPLACE FUNCTION chat.delete_pins_subs_for_room_person()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
DECLARE
    l_room record;
    l_chat record;
BEGIN
    SELECT ("chatId", "roomPrivacyName") FROM "Room" WHERE "Room"."id" = OLD."roomId" INTO l_room;

    IF l_room."chatId" IS NOT NULL THEN
        IF NOT chat.attendee_has_access_to_chat(OLD."attendeeId", l_room."chatId") THEN
            DELETE FROM "chat"."Pin" 
                WHERE "chat"."Pin"."chatId" = l_room."chatId" 
                  AND "chat"."Pin"."attendeeId" = OLD."attendeeId";

            DELETE FROM "chat"."Subscription" 
                WHERE "chat"."Pin"."chatId" = l_room."chatId" 
                  AND "chat"."Subscription"."attendeeId" = OLD."attendeeId";
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS delete_pins_subs on "RoomPerson";
CREATE TRIGGER delete_pins_subs AFTER DELETE ON "RoomPerson" FOR EACH ROW EXECUTE PROCEDURE chat.delete_pins_subs_for_room_person();


-----------------------------------------


CREATE OR REPLACE FUNCTION chat.update_pins_subs_for_room_or_contentgroup()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
DECLARE
    l_chat "chat"."Chat";
BEGIN
    IF (NEW."chatId" IS NOT NULL) THEN
        SELECT * FROM "chat"."Chat" WHERE "chat"."Chat"."id" = NEW."chatId" INTO l_chat;

        IF l_chat."enableAutoPin" OR l_chat."enableMandatoryPin" THEN
            INSERT INTO "chat"."Pin"("chatId", "attendeeId","wasManuallyPinned")
                (   SELECT NEW."chatId", "Attendee"."id", false
                    FROM "Attendee"
                    WHERE "Attendee"."conferenceId" = NEW."conferenceId"
                        AND chat.attendee_has_access_to_chat("Attendee"."id", NEW."chatId")
                )
                ON CONFLICT DO NOTHING;
        END IF;
    
        IF l_chat."enableAutoSubscribe" OR l_chat."enableMandatorySubscribe" THEN
            INSERT INTO "chat"."Subscription"("chatId", "attendeeId","wasManuallySubscribed")
                (   SELECT NEW."chatId", "Attendee"."id", false
                    FROM "Attendee"
                    WHERE "Attendee"."conferenceId" = NEW."conferenceId"
                        AND chat.attendee_has_access_to_chat("Attendee"."id", NEW."chatId")
                )
                ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    IF (OLD."chatId" IS NOT NULL) THEN
        DELETE FROM "chat"."Pin"
        WHERE "chat"."Pin"."chatId" = OLD."chatId"
          AND NOT ("chat"."Pin"."attendeeId" IN (
            SELECT "Attendee"."id" FROM "Attendee" WHERE chat.attendee_has_access_to_chat("Attendee"."id", OLD."chatId")
          ));
          
        DELETE FROM "chat"."Subscription"
        WHERE "chat"."Subscription"."chatId" = OLD."chatId"
          AND NOT ("chat"."Subscription"."attendeeId" IN (
            SELECT "Attendee"."id" FROM "Attendee" WHERE chat.attendee_has_access_to_chat("Attendee"."id", OLD."chatId")
          ));
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_pins_subs on "Room";
CREATE TRIGGER update_pins_subs AFTER UPDATE ON "Room" FOR EACH ROW WHEN (OLD."chatId" != NEW."chatId") EXECUTE PROCEDURE chat.update_pins_subs_for_room_or_contentgroup();

DROP TRIGGER IF EXISTS update_pins_subs on "ContentGroup";
CREATE TRIGGER update_pins_subs AFTER UPDATE ON "ContentGroup" FOR EACH ROW WHEN (OLD."chatId" != NEW."chatId") EXECUTE PROCEDURE chat.update_pins_subs_for_room_or_contentgroup();


-----------------------------------------


CREATE OR REPLACE FUNCTION chat.update_pins_subs_for_chat()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
BEGIN
    IF (NEW."enableAutoPin" AND NOT OLD."enableAutoPin") OR NEW."enableMandatoryPin" THEN
        INSERT INTO "chat"."Pin"("chatId", "attendeeId","wasManuallyPinned")
            (   SELECT NEW."id", "Attendee"."id", false
                FROM "Attendee"
                WHERE "Attendee"."conferenceId" = NEW."conferenceId"
                    AND chat.attendee_has_access_to_chat("Attendee"."id", NEW."id")
            )
            ON CONFLICT DO NOTHING;
    END IF;
    
    IF (NEW."enableAutoSubscribe" AND NOT OLD."enableAutoSubscribe") OR NEW."enableMandatorySubscribe" THEN
        INSERT INTO "chat"."Subscription"("chatId", "attendeeId","wasManuallySubscribed")
            (   SELECT NEW."id", "Attendee"."id", false
                FROM "Attendee"
                WHERE "Attendee"."conferenceId" = NEW."conferenceId"
                    AND chat.attendee_has_access_to_chat("Attendee"."id", NEW."id")
            )
            ON CONFLICT DO NOTHING;
    END IF;

    IF (NOT (NEW."enableAutoPin" OR NEW."enableMandatoryPin") AND (OLD."enableAutoPin" OR OLD."enableMandatoryPin")) THEN
        DELETE FROM "chat"."Pin"
        WHERE "chat"."Pin"."chatId" = OLD."id"
          AND NOT "chat"."Pin"."wasManuallyPinned";
    END IF;
    
    IF (NOT (NEW."enableAutoSubscribe" OR NEW."enableMandatorySubscribe") AND (OLD."enableAutoSubscribe" OR OLD."enableMandatorySubscribe")) THEN
        DELETE FROM "chat"."Subscription"
        WHERE "chat"."Subscription"."chatId" = OLD."id"
          AND NOT "chat"."Subscription"."wasManuallySubscribed";
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_pins_subs on "chat"."Chat";
CREATE TRIGGER update_pins_subs AFTER UPDATE ON "chat"."Chat" 
    FOR EACH ROW WHEN (OLD."enableAutoPin" != NEW."enableAutoPin"
                    OR OLD."enableMandatoryPin" != NEW."enableMandatoryPin"
                    OR OLD."enableAutoSubscribe" != NEW."enableAutoSubscribe"
                    OR OLD."enableMandatorySubscribe" != NEW."enableMandatorySubscribe"
                    )
    EXECUTE PROCEDURE chat.update_pins_subs_for_chat();


-----------------------------------------


-- Prevent deletion of mandatory pins IFF they are valid (i.e. link attendee and chat of the same conference)
CREATE OR REPLACE FUNCTION chat.prevent_delete_mandatory_pin()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    IF (    (SELECT chat."Chat"."enableMandatoryPin" FROM chat."Chat" WHERE chat."Chat"."id" = OLD."chatId")
        AND chat.attendee_has_access_to_chat(OLD."attendeeId", OLD."chatId")
    ) THEN
        RETURN NULL;
    ELSE
        RETURN OLD;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS prevent_delete_pins ON chat."Pin";
CREATE TRIGGER prevent_delete_pins BEFORE DELETE ON chat."Pin" FOR EACH ROW EXECUTE PROCEDURE chat.prevent_delete_mandatory_pin();


-- Prevent deletion of mandatory subs IFF they are valid (i.e. link attendee and chat of the same conference)
CREATE OR REPLACE FUNCTION chat.prevent_delete_mandatory_sub()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    IF (    (SELECT chat."Chat"."enableMandatorySubscribe" FROM chat."Chat" WHERE chat."Chat"."id" = OLD."chatId")
        AND chat.attendee_has_access_to_chat(OLD."attendeeId", OLD."chatId")
    ) THEN
        RETURN NULL;
    ELSE
        RETURN OLD;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS prevent_delete_subs ON chat."Subscription";
CREATE TRIGGER prevent_delete_subs BEFORE DELETE ON chat."Subscription" FOR EACH ROW EXECUTE PROCEDURE chat.prevent_delete_mandatory_sub();


----------------------------


-- Bring existing stuff up to scratch

DELETE FROM "chat"."Pin";
DELETE FROM "chat"."Subscription";

INSERT INTO "chat"."Pin"("chatId", "attendeeId","wasManuallyPinned")
    (   SELECT "chat"."Chat"."id", "Attendee"."id", false
        FROM "chat"."Chat"
        INNER JOIN "Attendee"
        ON "Attendee"."conferenceId" = "chat"."Chat"."conferenceId"
            AND ("chat"."Chat"."enableAutoPin" OR "chat"."Chat"."enableMandatoryPin")
            AND chat.attendee_has_access_to_chat("Attendee"."id", "chat"."Chat"."id")
    )
    ON CONFLICT DO NOTHING;


INSERT INTO "chat"."Subscription"("chatId", "attendeeId","wasManuallySubscribed")
    (   SELECT "chat"."Chat"."id", "Attendee"."id", false
        FROM "chat"."Chat"
        INNER JOIN "Attendee"
        ON "Attendee"."conferenceId" = "chat"."Chat"."conferenceId"
            AND ("chat"."Chat"."enableAutoSubscribe" OR "chat"."Chat"."enableMandatorySubscribe")
            AND chat.attendee_has_access_to_chat("Attendee"."id", "chat"."Chat"."id")
    )
    ON CONFLICT DO NOTHING;
