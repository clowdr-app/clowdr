DROP TRIGGER IF EXISTS "set_public_Group_updated_at" ON "public"."Group";
ALTER TABLE "public"."Group" DROP COLUMN "updated_at";
