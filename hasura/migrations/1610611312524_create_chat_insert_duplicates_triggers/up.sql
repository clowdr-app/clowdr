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
                INSERT INTO "chat"."Message" ("type", "chatId", "senderId", "message", "data", "isPinned", "duplicatedMessageId")
                VALUES (NEW."type", chatDuplicateToId, NEW."senderId", NEW."message", NEW."data", NEW."isPinned", NEW."id")
                RETURNING "id" 
            )
        UPDATE "chat"."Message" 
            SET "duplicatedMessageId" = newMessage."id"
            FROM newMessage
            WHERE "chat"."Message"."id" = NEW."id";
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
    messageDuplicateId integer;
BEGIN
    messageDuplicateId := (SELECT "duplicatedMessageId" FROM "chat"."Message" WHERE "id" = NEW."messageId");
    IF (messageDuplicateId IS NOT NULL) THEN
        WITH
            newReaction AS (
                INSERT INTO "chat"."Reaction" ("type", "messageId", "senderId", "symbol", "data", "duplicateId")
                VALUES (NEW."type", messageDuplicateId, NEW."senderId", NEW."symbol", NEW."data", NEW."id")
                RETURNING "id" 
            )
        UPDATE "chat"."Reaction" 
            SET "duplicateId" = newReaction."id"
            FROM newReaction
            WHERE "chat"."Reaction"."id" = NEW."id";
    END IF;
	RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS duplication_insert ON "chat"."Message";
CREATE TRIGGER duplication_insert AFTER INSERT 
    ON "chat"."Message" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicatedMessageId" IS NULL)
    EXECUTE PROCEDURE chat.on_insert_message();


DROP TRIGGER IF EXISTS duplication_insert ON "chat"."Reaction";
CREATE TRIGGER duplication_insert AFTER INSERT 
    ON "chat"."Reaction" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicateId" IS NULL)
    EXECUTE PROCEDURE chat.on_insert_reaction();
