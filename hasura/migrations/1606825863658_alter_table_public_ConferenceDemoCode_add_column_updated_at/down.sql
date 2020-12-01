DROP TRIGGER IF EXISTS "set_public_ConferenceDemoCode_updated_at" ON "public"."ConferenceDemoCode";
ALTER TABLE "public"."ConferenceDemoCode" DROP COLUMN "updated_at";
