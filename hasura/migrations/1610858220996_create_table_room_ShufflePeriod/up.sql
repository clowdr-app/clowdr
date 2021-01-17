CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "room"."ShufflePeriod"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "conferenceId" uuid NOT NULL, "startAt" timestamptz NOT NULL, "endAt" timestamptz NOT NULL, "roomDurationMinutes" integer NOT NULL, "targetAttendeesPerRoom" integer NOT NULL, "maxAttendeesPerRoom" integer NOT NULL, "waitRoomMaxDuration" integer NOT NULL, "name" text NOT NULL, "organiserId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("organiserId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE restrict);
CREATE OR REPLACE FUNCTION "room"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_room_ShufflePeriod_updated_at"
BEFORE UPDATE ON "room"."ShufflePeriod"
FOR EACH ROW
EXECUTE PROCEDURE "room"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_room_ShufflePeriod_updated_at" ON "room"."ShufflePeriod" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
