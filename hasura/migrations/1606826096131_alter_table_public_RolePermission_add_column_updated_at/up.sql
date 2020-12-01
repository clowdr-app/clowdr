ALTER TABLE "public"."RolePermission" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now();

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
CREATE TRIGGER "set_public_RolePermission_updated_at"
BEFORE UPDATE ON "public"."RolePermission"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_RolePermission_updated_at" ON "public"."RolePermission" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
