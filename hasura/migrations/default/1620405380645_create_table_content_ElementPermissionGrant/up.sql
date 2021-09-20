CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "content"."ElementPermissionGrant"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "permissionSetId" uuid NOT NULL, "conferenceSlug" text NOT NULL, "groupId" uuid, "entityId" uuid, PRIMARY KEY ("id") , FOREIGN KEY ("permissionSetId") REFERENCES "permissions"."Role"("id") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("groupId") REFERENCES "permissions"."Group"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("entityId") REFERENCES "content"."Element"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("permissionSetId", "groupId", "entityId"));
CREATE OR REPLACE FUNCTION "content"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_content_ElementPermissionGrant_updated_at"
BEFORE UPDATE ON "content"."ElementPermissionGrant"
FOR EACH ROW
EXECUTE PROCEDURE "content"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_content_ElementPermissionGrant_updated_at" ON "content"."ElementPermissionGrant" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
