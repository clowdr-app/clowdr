CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."AttendeeGoogleAccount"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "tokenData" jsonb NOT NULL, "attendeeId" uuid NOT NULL, "googleAccountEmail" text NOT NULL, "conferenceId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade);
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
CREATE TRIGGER "set_public_AttendeeGoogleAccount_updated_at"
BEFORE UPDATE ON "public"."AttendeeGoogleAccount"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_AttendeeGoogleAccount_updated_at" ON "public"."AttendeeGoogleAccount" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
