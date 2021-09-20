CREATE OR REPLACE FUNCTION chat.on_insert_reaction()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
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
$$;
