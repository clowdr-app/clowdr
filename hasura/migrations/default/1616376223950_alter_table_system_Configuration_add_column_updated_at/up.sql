ALTER TABLE "system"."Configuration" ADD COLUMN "updated_at" timestamptz NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "system"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_system_Configuration_updated_at"
BEFORE UPDATE ON "system"."Configuration"
FOR EACH ROW
EXECUTE PROCEDURE "system"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_system_Configuration_updated_at" ON "system"."Configuration" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
