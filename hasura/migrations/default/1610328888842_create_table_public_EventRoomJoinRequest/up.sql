CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."EventRoomJoinRequest"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "eventId" uuid NOT NULL, "attendeeId" uuid NOT NULL, "eventPersonRoleName" Text NOT NULL, "approved" boolean NOT NULL DEFAULT false, "conferenceId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("eventPersonRoleName") REFERENCES "public"."EventPersonRole"("name") ON UPDATE cascade ON DELETE cascade, UNIQUE ("eventId", "attendeeId"));
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
CREATE TRIGGER "set_public_EventRoomJoinRequest_updated_at"
BEFORE UPDATE ON "public"."EventRoomJoinRequest"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_EventRoomJoinRequest_updated_at" ON "public"."EventRoomJoinRequest" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
