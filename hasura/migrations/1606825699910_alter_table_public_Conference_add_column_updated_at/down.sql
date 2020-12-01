DROP TRIGGER IF EXISTS "set_public_Conference_updated_at" ON "public"."Conference";
ALTER TABLE "public"."Conference" DROP COLUMN "updated_at";
