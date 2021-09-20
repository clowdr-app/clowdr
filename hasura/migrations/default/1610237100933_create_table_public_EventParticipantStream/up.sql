CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."EventParticipantStream"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "eventId" uuid NOT NULL, "attendeeId" uuid NOT NULL, "conferenceId" uuid NOT NULL, "vonageConnectionId" text NOT NULL, "vonageStreamId" text NOT NULL, "vonageStreamType" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("eventId", "attendeeId", "vonageStreamId")); COMMENT ON TABLE "public"."EventParticipantStream" IS E'Current streams in event Vonage sessions.';
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
CREATE TRIGGER "set_public_EventParticipantStream_updated_at"
BEFORE UPDATE ON "public"."EventParticipantStream"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_EventParticipantStream_updated_at" ON "public"."EventParticipantStream" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
