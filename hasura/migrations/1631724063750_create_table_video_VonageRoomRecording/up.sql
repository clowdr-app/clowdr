CREATE TABLE "video"."VonageRoomRecording" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "roomId" uuid, "startedAt" timestamptz NOT NULL, "endedAt" timestamptz, "vonageSessionId" text NOT NULL, "s3Url" text, "initiatedBy" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("roomId") REFERENCES "room"."Room"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("initiatedBy") REFERENCES "registrant"."Registrant"("id") ON UPDATE cascade ON DELETE set null);
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
CREATE TRIGGER "set_video_VonageRoomRecording_updated_at"
BEFORE UPDATE ON "video"."VonageRoomRecording"
FOR EACH ROW
EXECUTE PROCEDURE "video"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_video_VonageRoomRecording_updated_at" ON "video"."VonageRoomRecording" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
