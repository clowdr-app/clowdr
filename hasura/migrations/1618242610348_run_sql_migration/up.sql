CREATE OR REPLACE FUNCTION chat.on_insert_message()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
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
$$;


CREATE OR REPLACE FUNCTION chat.on_insert_reaction()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    messageDuplicateSId uuid;
BEGIN
    messageDuplicateSId := (SELECT "duplicatedMessageSId" FROM "chat"."Message" WHERE "sId" = NEW."messageSId");
    IF (messageDuplicateSId IS NOT NULL) THEN
        WITH
            newReaction AS (
                INSERT INTO "chat"."Reaction" ("type", "messageSId", "senderId", "symbol", "data", "duplicateSId")
                VALUES (NEW."type", messageDuplicateSId, NEW."senderId", NEW."symbol", NEW."data", NEW."sId")
                RETURNING "sId" 
            )
        UPDATE "chat"."Reaction" 
            SET "duplicateSId" = newReaction."sId"
            FROM newReaction
            WHERE "chat"."Reaction"."sId" = NEW."sId";
    END IF;
	RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS duplication_insert ON "chat"."Message";
CREATE TRIGGER duplication_insert AFTER INSERT 
    ON "chat"."Message" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicatedMessageSId" IS NULL)
    EXECUTE PROCEDURE chat.on_insert_message();


DROP TRIGGER IF EXISTS duplication_insert ON "chat"."Reaction";
CREATE TRIGGER duplication_insert AFTER INSERT 
    ON "chat"."Reaction" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicateSId" IS NULL)
    EXECUTE PROCEDURE chat.on_insert_reaction();


CREATE OR REPLACE FUNCTION chat.on_update_message()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
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
$$;

CREATE OR REPLACE FUNCTION chat.on_update_reaction()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    UPDATE "chat"."Reaction"
        SET "type" = NEW."type",
            "senderId" = NEW."senderId",
            "symbol" = NEW."symbol",
            "data" = NEW."data"
        WHERE "chat"."Reaction"."sId" = NEW."duplicateSId";
	RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS duplication_update ON "chat"."Message";
CREATE TRIGGER duplication_update AFTER UPDATE 
    ON "chat"."Message" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicatedMessageSId" IS NOT NULL)
    EXECUTE PROCEDURE chat.on_update_message();


DROP TRIGGER IF EXISTS duplication_update ON "chat"."Reaction";
CREATE TRIGGER duplication_update AFTER UPDATE 
    ON "chat"."Reaction" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicateSId" IS NOT NULL)
    EXECUTE PROCEDURE chat.on_update_reaction();
