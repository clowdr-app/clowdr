CREATE TABLE "system"."ConfigurationPermissionGrant" ("permissionName" text NOT NULL, "userId" text NOT NULL, "configurationKey" text NOT NULL, "id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("permissionName") REFERENCES "system"."SuperUserPermission"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("configurationKey") REFERENCES "system"."ConfigurationKey"("name") ON UPDATE cascade ON DELETE cascade, UNIQUE ("permissionName", "userId", "configurationKey"));
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
CREATE TRIGGER "set_system_ConfigurationPermissionGrant_updated_at"
BEFORE UPDATE ON "system"."ConfigurationPermissionGrant"
FOR EACH ROW
EXECUTE PROCEDURE "system"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_system_ConfigurationPermissionGrant_updated_at" ON "system"."ConfigurationPermissionGrant" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
