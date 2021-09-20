ALTER TABLE "public"."AttendeeProfile" ADD COLUMN "photoS3URL_50x50" text;
ALTER TABLE "public"."AttendeeProfile" ALTER COLUMN "photoS3URL_50x50" DROP NOT NULL;
