
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."TranscriptionJob"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "contentItemId" uuid NOT NULL, "awsTranscribeJobName" text NOT NULL, "videoS3Url" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("awsTranscribeJobName"));
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_TranscriptionJob_updated_at"
BEFORE UPDATE ON "public"."TranscriptionJob"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_TranscriptionJob_updated_at" ON "public"."TranscriptionJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

ALTER TABLE "public"."TranscriptionJob" ADD COLUMN "transcriptionS3Url" text NOT NULL;

ALTER TABLE "public"."TranscriptionJob" ADD COLUMN "languageCode" text NOT NULL;
