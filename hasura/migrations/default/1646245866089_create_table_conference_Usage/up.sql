CREATE TABLE "conference"."Usage" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "conferenceId" uuid NOT NULL, "consumedStreamingEventTotalMinutes" integer NOT NULL DEFAULT 0, "consumedVideoChatEventTotalMinutes" integer NOT NULL DEFAULT 0, "consumedVideoChatNonEventTotalMinutes" integer NOT NULL DEFAULT 0, "consumedSupportMeetingMinutes" integer NOT NULL DEFAULT 0, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "conference"."Conference"("id") ON UPDATE cascade ON DELETE restrict, UNIQUE ("conferenceId"));
CREATE OR REPLACE FUNCTION "conference"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_conference_Usage_updated_at"
BEFORE UPDATE ON "conference"."Usage"
FOR EACH ROW
EXECUTE PROCEDURE "conference"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_conference_Usage_updated_at" ON "conference"."Usage" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
