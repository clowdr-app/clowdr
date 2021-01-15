CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "presence"."Page"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "path" text NOT NULL, "attendeeId" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"));
CREATE OR REPLACE FUNCTION "presence"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_presence_Page_updated_at"
BEFORE UPDATE ON "presence"."Page"
FOR EACH ROW
EXECUTE PROCEDURE "presence"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_presence_Page_updated_at" ON "presence"."Page" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
