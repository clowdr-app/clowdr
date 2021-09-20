CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Inivitation"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "attendeeId" uuid NOT NULL, "invitedEmailAddress" Text NOT NULL, "inviteCode" uuid NOT NULL, "linkToUserId" Text, "confirmationCode" uuid, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("linkToUserId") REFERENCES "public"."User"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("id"), UNIQUE ("attendeeId"), UNIQUE ("inviteCode"), UNIQUE ("confirmationCode"));
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
CREATE TRIGGER "set_public_Inivitation_updated_at"
BEFORE UPDATE ON "public"."Inivitation"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Inivitation_updated_at" ON "public"."Inivitation" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
