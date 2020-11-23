ALTER TABLE "public"."Chat" ADD COLUMN "lastMessageIndex" int4;
ALTER TABLE "public"."Chat" ALTER COLUMN "lastMessageIndex" DROP NOT NULL;
ALTER TABLE "public"."Chat" ALTER COLUMN "lastMessageIndex" SET DEFAULT 0;
