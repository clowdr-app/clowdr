CREATE TABLE "public"."Tag"("id" uuid NOT NULL, "name" Text NOT NULL, "colour" Text NOT NULL, "originatingDataId" uuid, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("originatingDataId") REFERENCES "public"."OriginatingData"("id") ON UPDATE cascade ON DELETE restrict, UNIQUE ("id"));
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
CREATE TRIGGER "set_public_Tag_updated_at"
BEFORE UPDATE ON "public"."Tag"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Tag_updated_at" ON "public"."Tag" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
