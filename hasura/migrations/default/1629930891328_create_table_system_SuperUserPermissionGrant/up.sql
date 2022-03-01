CREATE TABLE "system"."SuperUserPermissionGrant" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "grantedPermissionName" text NOT NULL, "userId" text NOT NULL, "targetPermissionName" text, PRIMARY KEY ("id") , FOREIGN KEY ("grantedPermissionName") REFERENCES "system"."SuperUserPermission"("name") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("targetPermissionName") REFERENCES "system"."SuperUserPermission"("name") ON UPDATE cascade ON DELETE cascade, UNIQUE ("grantedPermissionName", "userId", "targetPermissionName"));
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
CREATE TRIGGER "set_system_SuperUserPermissionGrant_updated_at"
BEFORE UPDATE ON "system"."SuperUserPermissionGrant"
FOR EACH ROW
EXECUTE PROCEDURE "system"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_system_SuperUserPermissionGrant_updated_at" ON "system"."SuperUserPermissionGrant" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
