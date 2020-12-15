
ALTER TABLE "public"."TranscriptionJob" DROP COLUMN "languageCode";

ALTER TABLE "public"."TranscriptionJob" DROP COLUMN "transcriptionS3Url";

DROP TABLE "public"."TranscriptionJob";
