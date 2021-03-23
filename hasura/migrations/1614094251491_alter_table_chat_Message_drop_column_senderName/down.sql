ALTER TABLE "chat"."Message" ADD COLUMN "senderName" text;
ALTER TABLE "chat"."Message" ALTER COLUMN "senderName" DROP NOT NULL;
ALTER TABLE "chat"."Message" ALTER COLUMN "senderName" SET DEFAULT ' '::text;
