CREATE TABLE IF NOT EXISTS "video"."ImmediateSwitch" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "data" jsonb NOT NULL, "eventId" uuid, "executedAt" timestamptz, "errorMessage" text, PRIMARY KEY ("id") , FOREIGN KEY ("eventId") REFERENCES "schedule"."Event"("id") ON UPDATE cascade ON DELETE cascade);
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
DROP TRIGGER IF EXISTS "set_video_ImmediateSwitch_updated_at" on "video"."ImmediateSwitch";
CREATE TRIGGER "set_video_ImmediateSwitch_updated_at"
BEFORE UPDATE ON "video"."ImmediateSwitch"
FOR EACH ROW
EXECUTE PROCEDURE "video"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_video_ImmediateSwitch_updated_at" ON "video"."ImmediateSwitch" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
