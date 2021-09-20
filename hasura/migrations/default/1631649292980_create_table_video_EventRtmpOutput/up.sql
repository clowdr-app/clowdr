CREATE TABLE "video"."EventRtmpOutput" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "url" text NOT NULL, "streamKey" text NOT NULL, "eventId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("eventId") REFERENCES "schedule"."Event"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("eventId"));COMMENT ON TABLE "video"."EventRtmpOutput" IS E'Enables broadcasting of a live-stream event to an RTMP-capable service, such as YouTube.';
CREATE OR REPLACE FUNCTION "video"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_video_EventRtmpOutput_updated_at"
BEFORE UPDATE ON "video"."EventRtmpOutput"
FOR EACH ROW
EXECUTE PROCEDURE "video"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_video_EventRtmpOutput_updated_at" ON "video"."EventRtmpOutput" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
