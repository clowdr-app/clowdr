CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Email"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" text, "invitationId" uuid, "plainTextContents" text NOT NULL, "htmlContents" text NOT NULL, "emailAddress" text NOT NULL, "reason" text NOT NULL, "sendAt" timestamptz NOT NULL DEFAULT now(), "sentAt" timestamptz, "retriesCount" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("invitationId") REFERENCES "public"."Invitation"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("id"));
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
CREATE TRIGGER "set_public_Email_updated_at"
BEFORE UPDATE ON "public"."Email"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Email_updated_at" ON "public"."Email" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
