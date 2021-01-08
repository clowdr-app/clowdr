ALTER TABLE "chat"."Message" ADD COLUMN "duplicatedMessageId" uuid;
ALTER TABLE "chat"."Message" ALTER COLUMN "duplicatedMessageId" DROP NOT NULL;
ALTER TABLE "chat"."Message" ADD CONSTRAINT Message_duplicatedMessageId_key UNIQUE (duplicatedMessageId);
