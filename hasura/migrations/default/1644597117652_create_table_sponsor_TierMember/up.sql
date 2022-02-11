CREATE TABLE "sponsor"."TierMember" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "tierId" uuid NOT NULL, "itemId" uuid NOT NULL, "priority" integer, PRIMARY KEY ("id") , FOREIGN KEY ("tierId") REFERENCES "sponsor"."Tier"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("itemId") REFERENCES "content"."Item"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("tierId", "itemId"));
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
CREATE TRIGGER "set_sponsor_TierMember_updated_at"
BEFORE UPDATE ON "sponsor"."TierMember"
FOR EACH ROW
EXECUTE PROCEDURE "sponsor"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_sponsor_TierMember_updated_at" ON "sponsor"."TierMember" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
