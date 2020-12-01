CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."RoomParticipant"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "roomId" uuid NOT NULL, "attendeeId" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("roomId", "attendeeId"));
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
CREATE TRIGGER "set_public_RoomParticipant_updated_at"
BEFORE UPDATE ON "public"."RoomParticipant"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_RoomParticipant_updated_at" ON "public"."RoomParticipant" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
