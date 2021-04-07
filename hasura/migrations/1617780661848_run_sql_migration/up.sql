UPDATE "chat"."Reaction" as original
SET "chatId" = (SELECT "chatId" FROM "chat"."Message" WHERE "chat"."Message"."sId" = original."messageSId");
