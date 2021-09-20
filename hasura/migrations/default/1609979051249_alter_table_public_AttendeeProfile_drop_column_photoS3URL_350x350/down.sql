ALTER TABLE "public"."AttendeeProfile" ADD COLUMN "photoS3URL_350x350" text;
ALTER TABLE "public"."AttendeeProfile" ALTER COLUMN "photoS3URL_350x350" DROP NOT NULL;
