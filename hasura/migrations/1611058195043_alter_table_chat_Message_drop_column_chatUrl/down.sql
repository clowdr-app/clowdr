ALTER TABLE "chat"."Message" ADD COLUMN "chatUrl" text;
ALTER TABLE "chat"."Message" ALTER COLUMN "chatUrl" DROP NOT NULL;
