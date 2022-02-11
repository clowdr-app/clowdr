CREATE TABLE "sponsor"."Tier" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "conferenceId" uuid NOT NULL, "subconferenceId" uuid, "name" text NOT NULL, "description" text NOT NULL, "priority" integer NOT NULL, "colour" text, "size" numeric NOT NULL, "showLogos" boolean NOT NULL DEFAULT true, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "conference"."Conference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("subconferenceId") REFERENCES "conference"."Subconference"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("conferenceId", "subconferenceId", "name"));
CREATE OR REPLACE FUNCTION "sponsor"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_sponsor_Tier_updated_at"
BEFORE UPDATE ON "sponsor"."Tier"
FOR EACH ROW
EXECUTE PROCEDURE "sponsor"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_sponsor_Tier_updated_at" ON "sponsor"."Tier" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
