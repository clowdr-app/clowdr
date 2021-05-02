DROP FUNCTION "chat"."canAccessChat";
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
          AND ( "room"."Room"."roomManagementModeName" = 'PUBLIC'
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
    SELECT "chatId", "roomManagementModeName" FROM "room"."Room" WHERE "room"."Room"."id" = OLD."roomId" INTO l_room;

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
            isDM := (NEW."roomManagementModeName" = 'DM');
        END IF;

	    INSERT INTO chat."Chat" ("conferenceId","enableAutoSubscribe","enableAutoPin") VALUES (NEW."conferenceId", isDM, isDM) RETURNING "id" INTO nid;
        NEW."chatId" := nid;
    END IF;
	RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."generatePinsSubsForNewRegistrant"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN 
    INSERT INTO "chat"."Pin"("chatId", "registrantId","wasManuallyPinned")
        (   SELECT "chat"."Chat"."id", NEW."id", false
            FROM "chat"."Chat"
            WHERE "chat"."Chat"."conferenceId" = NEW."conferenceId"
                AND ("chat"."Chat"."enableAutoPin" OR "chat"."Chat"."enableMandatoryPin")
                AND "chat"."canAccessChat"(NEW."id", "chat"."Chat"."id")
        )
        ON CONFLICT DO NOTHING;
            
    INSERT INTO "chat"."Subscription"("chatId", "registrantId","wasManuallySubscribed")
        (   SELECT "chat"."Chat"."id", NEW."id", false
            FROM "chat"."Chat"
            WHERE "chat"."Chat"."conferenceId" = NEW."conferenceId"
                AND ("chat"."Chat"."enableAutoSubscribe" OR "chat"."Chat"."enableMandatorySubscribe")
                AND "chat"."canAccessChat"(NEW."id", "chat"."Chat"."id")
        )
        ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."generatePinsSubsForNewChat"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
BEGIN
    INSERT INTO "chat"."Pin"("chatId", "registrantId","wasManuallyPinned")
        (   SELECT NEW."id", "registrant"."Registrant"."id", false
            FROM "registrant"."Registrant"
            WHERE "registrant"."Registrant"."conferenceId" = NEW."conferenceId"
                AND (NEW."enableAutoPin" OR NEW."enableMandatoryPin")
                AND "chat"."canAccessChat"("registrant"."Registrant"."id", NEW."id")
        )
        ON CONFLICT DO NOTHING;

    INSERT INTO "chat"."Subscription"("chatId", "registrantId","wasManuallySubscribed")
        (   SELECT NEW."id", "registrant"."Registrant"."id", false
            FROM "registrant"."Registrant"
            WHERE "registrant"."Registrant"."conferenceId" = NEW."conferenceId"
                AND (NEW."enableAutoSubscribe" OR NEW."enableMandatorySubscribe")
                AND "chat"."canAccessChat"("registrant"."Registrant"."id", NEW."id")
        )
        ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."generatePinsSubsForNewRoomPerson"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
    l_chatId uuid;
    l_chat record;
BEGIN
    SELECT "chatId" FROM "room"."Room" WHERE "room"."Room"."id" = NEW."roomId" INTO l_chatId;

    IF l_chatId IS NOT NULL THEN
        SELECT "enableAutoPin", "enableMandatoryPin", "enableAutoSubscribe", "enableMandatorySubscribe" 
            FROM "chat"."Chat"
            WHERE "chat"."Chat"."id" = l_chatId 
            INTO l_chat;

        IF l_chat."enableAutoPin" OR l_chat."enableMandatoryPin" THEN
            INSERT INTO "chat"."Pin"("chatId", "registrantId","wasManuallyPinned")
                VALUES (l_chatId, NEW."registrantId", false)
                ON CONFLICT DO NOTHING;
        END IF;

        IF l_chat."enableAutoSubscribe" OR l_chat."enableMandatorySubscribe" THEN
            INSERT INTO "chat"."Subscription"("chatId", "registrantId","wasManuallySubscribed")
                VALUES (l_chatId, NEW."registrantId", false)
                ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."onInsertMessage"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
    chatDuplicateToId uuid;
BEGIN
    chatDuplicateToId := (SELECT "duplicateToId" FROM "chat"."Chat" WHERE "id" = NEW."chatId");
    IF (chatDuplicateToId IS NOT NULL) THEN
        WITH
            newMessage AS (
                INSERT INTO "chat"."Message" ("type", "chatId", "senderId", "message", "data", "isPinned", "duplicatedMessageSId")
                VALUES (NEW."type", chatDuplicateToId, NEW."senderId", NEW."message", NEW."data", NEW."isPinned", NEW."sId")
                RETURNING "sId" 
            )
        UPDATE "chat"."Message" 
            SET "duplicatedMessageSId" = newMessage."sId"
            FROM newMessage
            WHERE "chat"."Message"."sId" = NEW."sId";
    END IF;
	RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."onInsertReaction"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
    messageDuplicateSId uuid;
    otherChatId uuid;
BEGIN
    messageDuplicateSId := (SELECT "duplicatedMessageSId" FROM "chat"."Message" WHERE "sId" = NEW."messageSId");
    IF (messageDuplicateSId IS NOT NULL) THEN
        otherChatId := (SELECT "chatId" FROM "chat"."Message" WHERE "sId" = messageDuplicateSId);
        WITH
            newReaction AS (
                INSERT INTO "chat"."Reaction" ("chatId", "type", "messageSId", "senderId", "symbol", "data", "duplicateSId")
                VALUES (otherChatId, NEW."type", messageDuplicateSId, NEW."senderId", NEW."symbol", NEW."data", NEW."sId")
                RETURNING "sId" 
            )
        UPDATE "chat"."Reaction" 
            SET "duplicateSId" = newReaction."sId"
            FROM newReaction
            WHERE "chat"."Reaction"."sId" = NEW."sId";
    END IF;
	RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."onUpdateMessage"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN 
    UPDATE "chat"."Message"
        SET "type" = NEW."type",
            "senderId" = NEW."senderId",
            "message" = NEW."message",
            "data" = NEW."data",
            "isPinned" = NEW."isPinned"
        WHERE "chat"."Message"."sId" = NEW."duplicatedMessageSId";
	RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."onUpdateReaction"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN 
    UPDATE "chat"."Reaction"
        SET "type" = NEW."type",
            "senderId" = NEW."senderId",
            "symbol" = NEW."symbol",
            "data" = NEW."data"
        WHERE "chat"."Reaction"."sId" = NEW."duplicateSId";
	RETURN NEW;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."preventDeleteMandatoryPin"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN 
    IF (    (SELECT chat."Chat"."enableMandatoryPin" FROM chat."Chat" WHERE chat."Chat"."id" = OLD."chatId")
        AND "chat"."canAccessChat"(OLD."registrantId", OLD."chatId")
    ) THEN
        RETURN NULL;
    ELSE
        RETURN OLD;
    END IF;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."preventDeleteMandatorySub"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN 
    IF (    (SELECT chat."Chat"."enableMandatorySubscribe" FROM chat."Chat" WHERE chat."Chat"."id" = OLD."chatId")
        AND "chat"."canAccessChat"(OLD."registrantId", OLD."chatId")
    ) THEN
        RETURN NULL;
    ELSE
        RETURN OLD;
    END IF;
END;
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."updatePinsSubsForChat"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN 
    IF (NEW."enableAutoPin" AND NOT OLD."enableAutoPin") OR NEW."enableMandatoryPin" THEN
        INSERT INTO "chat"."Pin"("chatId", "registrantId","wasManuallyPinned")
            (   SELECT NEW."id", "registrant"."Registrant"."id", false
                FROM "registrant"."Registrant"
                WHERE "registrant"."Registrant"."conferenceId" = NEW."conferenceId"
                    AND "chat"."canAccessChat"("registrant"."Registrant"."id", NEW."id")
            )
            ON CONFLICT DO NOTHING;
    END IF;
    
    IF (NEW."enableAutoSubscribe" AND NOT OLD."enableAutoSubscribe") OR NEW."enableMandatorySubscribe" THEN
        INSERT INTO "chat"."Subscription"("chatId", "registrantId","wasManuallySubscribed")
            (   SELECT NEW."id", "registrant"."Registrant"."id", false
                FROM "registrant"."Registrant"
                WHERE "registrant"."Registrant"."conferenceId" = NEW."conferenceId"
                    AND "chat"."canAccessChat"("registrant"."Registrant"."id", NEW."id")
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
$BODY$;


CREATE OR REPLACE FUNCTION "chat"."updatePinsSubsForRoomOrItem"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
    l_chat "chat"."Chat";
BEGIN
    IF (NEW."chatId" IS NOT NULL) THEN
        SELECT * FROM "chat"."Chat" WHERE "chat"."Chat"."id" = NEW."chatId" INTO l_chat;

        IF l_chat."enableAutoPin" OR l_chat."enableMandatoryPin" THEN
            INSERT INTO "chat"."Pin"("chatId", "registrantId","wasManuallyPinned")
                (   SELECT NEW."chatId", "registrant"."Registrant"."id", false
                    FROM "registrant"."Registrant"
                    WHERE "registrant"."Registrant"."conferenceId" = NEW."conferenceId"
                        AND "chat"."canAccessChat"("registrant"."Registrant"."id", NEW."chatId")
                )
                ON CONFLICT DO NOTHING;
        END IF;
    
        IF l_chat."enableAutoSubscribe" OR l_chat."enableMandatorySubscribe" THEN
            INSERT INTO "chat"."Subscription"("chatId", "registrantId","wasManuallySubscribed")
                (   SELECT NEW."chatId", "registrant"."Registrant"."id", false
                    FROM "registrant"."Registrant"
                    WHERE "registrant"."Registrant"."conferenceId" = NEW."conferenceId"
                        AND "chat"."canAccessChat"("registrant"."Registrant"."id", NEW."chatId")
                )
                ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    IF (OLD."chatId" IS NOT NULL) THEN
        DELETE FROM "chat"."Pin"
        WHERE "chat"."Pin"."chatId" = OLD."chatId"
          AND NOT ("chat"."Pin"."registrantId" IN (
            SELECT "registrant"."Registrant"."id" FROM "registrant"."Registrant" WHERE "chat"."canAccessChat"("registrant"."Registrant"."id", OLD."chatId")
          ));
          
        DELETE FROM "chat"."Subscription"
        WHERE "chat"."Subscription"."chatId" = OLD."chatId"
          AND NOT ("chat"."Subscription"."registrantId" IN (
            SELECT "registrant"."Registrant"."id" FROM "registrant"."Registrant" WHERE "chat"."canAccessChat"("registrant"."Registrant"."id", OLD."chatId")
          ));
    END IF;
    
    RETURN NEW;
END;
$BODY$;
