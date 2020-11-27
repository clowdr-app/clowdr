CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."RolePermission"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "roleId" uuid NOT NULL, "permission" Text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("permission") REFERENCES "public"."Permission"("name") ON UPDATE cascade ON DELETE restrict, UNIQUE ("id"), UNIQUE ("roleId", "permission"));
