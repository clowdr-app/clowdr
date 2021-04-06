UPDATE "chat"."Reaction" as original
SET "messageSId" = (SELECT "sId" FROM "chat"."Message" WHERE "chat"."Message"."id" = original."messageId");
