DROP TRIGGER IF EXISTS "set_public_OnlineStatus_updated_at" ON "public"."OnlineStatus";
ALTER TABLE "public"."OnlineStatus" DROP COLUMN "updated_at";
