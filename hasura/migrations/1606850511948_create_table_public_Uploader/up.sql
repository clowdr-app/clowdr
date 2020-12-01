CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Uploader"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "requiredContentItemId" uuid NOT NULL, "email" text NOT NULL, "name" text NOT NULL, "emailsSentCount" integer NOT NULL DEFAULT 0, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("requiredContentItemId") REFERENCES "public"."RequiredContentItem"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("email", "requiredContentItemId"));
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
CREATE TRIGGER "set_public_Uploader_updated_at"
BEFORE UPDATE ON "public"."Uploader"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Uploader_updated_at" ON "public"."Uploader" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
