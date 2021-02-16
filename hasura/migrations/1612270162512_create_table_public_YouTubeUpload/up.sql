CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."YouTubeUpload"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "videoId" text NOT NULL, "videoStatus" text NOT NULL, "videoTitle" text NOT NULL, "contentItemId" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("contentItemId") REFERENCES "public"."ContentItem"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("videoId"));
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
CREATE TRIGGER "set_public_YouTubeUpload_updated_at"
BEFORE UPDATE ON "public"."YouTubeUpload"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_YouTubeUpload_updated_at" ON "public"."YouTubeUpload" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
