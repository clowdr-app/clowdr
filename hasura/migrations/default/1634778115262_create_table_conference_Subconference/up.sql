CREATE TABLE "conference"."Subconference" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "name" text NOT NULL, "shortName" text NOT NULL, "conferenceId" uuid NOT NULL, "slug" text NOT NULL, "conferenceVisibilityLevel" text NOT NULL DEFAULT 'INTERNAL', "defaultProgramVisibilityLevel" text NOT NULL DEFAULT 'INTERNAL', PRIMARY KEY ("id") , FOREIGN KEY ("conferenceVisibilityLevel") REFERENCES "conference"."VisibilityLevel"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("defaultProgramVisibilityLevel") REFERENCES "conference"."VisibilityLevel"("name") ON UPDATE cascade ON DELETE restrict, UNIQUE ("conferenceId", "name"), UNIQUE ("conferenceId", "shortName"), UNIQUE ("conferenceId", "slug"));
CREATE OR REPLACE FUNCTION "conference"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_conference_Subconference_updated_at"
BEFORE UPDATE ON "conference"."Subconference"
FOR EACH ROW
EXECUTE PROCEDURE "conference"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_conference_Subconference_updated_at" ON "conference"."Subconference" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
