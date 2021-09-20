CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."RoomPerson"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "attendeeId" uuid NOT NULL, "roomId" uuid NOT NULL, "roomPersonRoleName" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("roomPersonRoleName") REFERENCES "public"."RoomPersonRole"("name") ON UPDATE cascade ON DELETE restrict, UNIQUE ("attendeeId", "roomId"));
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
CREATE TRIGGER "set_public_RoomPerson_updated_at"
BEFORE UPDATE ON "public"."RoomPerson"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_RoomPerson_updated_at" ON "public"."RoomPerson" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
