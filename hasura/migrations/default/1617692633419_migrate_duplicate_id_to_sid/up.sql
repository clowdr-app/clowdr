UPDATE "chat"."Message" as original
SET "duplicatedMessageSId" = (SELECT "sId" FROM "chat"."Message" WHERE "chat"."Message"."id" = original."duplicatedMessageId")
WHERE original."duplicatedMessageId" IS NOT NULL;

UPDATE "chat"."Reaction" as original
SET "duplicateSId" = (SELECT "sId" FROM "chat"."Reaction" WHERE "chat"."Reaction"."id" = original."duplicateId")
WHERE original."duplicateId" IS NOT NULL;
