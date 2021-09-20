CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Hallway"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "name" text NOT NULL, "colour" text NOT NULL DEFAULT 'rgba(0,0,0,0)', "priority" integer NOT NULL DEFAULT 0, "conferenceId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("name", "conferenceId"));
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
CREATE TRIGGER "set_public_Hallway_updated_at"
BEFORE UPDATE ON "public"."Hallway"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Hallway_updated_at" ON "public"."Hallway" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
