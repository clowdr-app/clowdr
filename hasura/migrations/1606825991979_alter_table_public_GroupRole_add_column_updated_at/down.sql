DROP TRIGGER IF EXISTS "set_public_GroupRole_updated_at" ON "public"."GroupRole";
ALTER TABLE "public"."GroupRole" DROP COLUMN "updated_at";
