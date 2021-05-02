ALTER TABLE "public"."AttendeeProfile" ADD COLUMN "realName" text;
ALTER TABLE "public"."AttendeeProfile" ALTER COLUMN "realName" DROP NOT NULL;
