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
        WHERE "chat"."Message"."id" = NEW."duplicatedMessageId";
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
        WHERE "chat"."Reaction"."id" = NEW."duplicateId";
	RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS duplication_update ON "chat"."Message";
CREATE TRIGGER duplication_update AFTER UPDATE 
    ON "chat"."Message" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicatedMessageId" IS NOT NULL)
    EXECUTE PROCEDURE chat.on_update_message();


DROP TRIGGER IF EXISTS duplication_update ON "chat"."Reaction";
CREATE TRIGGER duplication_update AFTER UPDATE 
    ON "chat"."Reaction" 
    FOR EACH ROW 
    WHEN (pg_trigger_depth() < 1 AND NEW."duplicateId" IS NOT NULL)
    EXECUTE PROCEDURE chat.on_update_reaction();
