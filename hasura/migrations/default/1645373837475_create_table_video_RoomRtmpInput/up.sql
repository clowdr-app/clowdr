CREATE TABLE "video"."RoomRtmpInput" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "inputName" text NOT NULL, "address" text, "applicationName" text NOT NULL DEFAULT 'midspace', "applicationInstance" text NOT NULL DEFAULT gen_random_uuid(), "roomId" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("roomId") REFERENCES "room"."Room"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("inputName"), UNIQUE ("roomId"), UNIQUE ("applicationInstance"));
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
CREATE TRIGGER "set_video_RoomRtmpInput_updated_at"
BEFORE UPDATE ON "video"."RoomRtmpInput"
FOR EACH ROW
EXECUTE PROCEDURE "video"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_video_RoomRtmpInput_updated_at" ON "video"."RoomRtmpInput" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
