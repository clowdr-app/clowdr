DROP TRIGGER IF EXISTS "set_public_Role_updated_at" ON "public"."Role";
ALTER TABLE "public"."Role" DROP COLUMN "updated_at";
