DROP TRIGGER IF EXISTS "set_public_Broadcast_updated_at" ON "public"."Broadcast";
ALTER TABLE "public"."Broadcast" DROP COLUMN "updated_at";
