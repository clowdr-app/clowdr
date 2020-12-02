CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ConferenceConfiguration"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "conferenceId" UUID NOT NULL, "key" text NOT NULL, "value" jsonb NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("conferenceId", "key"));
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
CREATE TRIGGER "set_public_ConferenceConfiguration_updated_at"
BEFORE UPDATE ON "public"."ConferenceConfiguration"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_ConferenceConfiguration_updated_at" ON "public"."ConferenceConfiguration" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
