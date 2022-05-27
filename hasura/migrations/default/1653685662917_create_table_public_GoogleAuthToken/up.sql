CREATE TABLE "public"."GoogleAuthToken" ("sub" text NOT NULL, "tokenData" jsonb NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("sub") , UNIQUE ("sub"));
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
CREATE TRIGGER "set_public_GoogleAuthToken_updated_at"
BEFORE UPDATE ON "public"."GoogleAuthToken"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_GoogleAuthToken_updated_at" ON "public"."GoogleAuthToken" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
