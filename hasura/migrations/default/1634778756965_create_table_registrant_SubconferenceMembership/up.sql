CREATE TABLE "registrant"."SubconferenceMembership" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "subconferenceId" uuid NOT NULL, "registrantId" uuid NOT NULL, "role" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("subconferenceId") REFERENCES "conference"."Subconference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("registrantId") REFERENCES "registrant"."Registrant"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("role") REFERENCES "registrant"."RegistrantRole"("name") ON UPDATE cascade ON DELETE restrict, UNIQUE ("subconferenceId", "registrantId"));
CREATE OR REPLACE FUNCTION "registrant"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_registrant_SubconferenceMembership_updated_at"
BEFORE UPDATE ON "registrant"."SubconferenceMembership"
FOR EACH ROW
EXECUTE PROCEDURE "registrant"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_registrant_SubconferenceMembership_updated_at" ON "registrant"."SubconferenceMembership" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
