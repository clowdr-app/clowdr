ALTER TABLE "chat"."Message" ADD COLUMN "chatTitle" text;
ALTER TABLE "chat"."Message" ALTER COLUMN "chatTitle" DROP NOT NULL;
ALTER TABLE "chat"."Message" ALTER COLUMN "chatTitle" SET DEFAULT ' '::text;
