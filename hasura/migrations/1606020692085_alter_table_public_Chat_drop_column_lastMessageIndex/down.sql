ALTER TABLE "public"."Chat" ADD COLUMN "lastMessageIndex" int4;
ALTER TABLE "public"."Chat" ALTER COLUMN "lastMessageIndex" DROP NOT NULL;
