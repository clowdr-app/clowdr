CREATE TABLE "registrant"."SavedVonageRoomRecording" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "recordingId" uuid NOT NULL, "isHidden" boolean NOT NULL DEFAULT false, "registrantId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("recordingId") REFERENCES "video"."VonageRoomRecording"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("registrantId") REFERENCES "registrant"."Registrant"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("recordingId", "registrantId"));
CREATE OR REPLACE FUNCTION "registrant"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_registrant_SavedVonageRoomRecording_updated_at"
BEFORE UPDATE ON "registrant"."SavedVonageRoomRecording"
FOR EACH ROW
EXECUTE PROCEDURE "registrant"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_registrant_SavedVonageRoomRecording_updated_at" ON "registrant"."SavedVonageRoomRecording" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
