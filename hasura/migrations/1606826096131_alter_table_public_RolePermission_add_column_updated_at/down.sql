DROP TRIGGER IF EXISTS "set_public_RolePermission_updated_at" ON "public"."RolePermission";
ALTER TABLE "public"."RolePermission" DROP COLUMN "updated_at";
