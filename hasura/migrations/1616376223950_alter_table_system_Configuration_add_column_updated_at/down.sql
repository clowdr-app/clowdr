DROP TRIGGER IF EXISTS "set_system_Configuration_updated_at" ON "system"."Configuration";
ALTER TABLE "system"."Configuration" DROP COLUMN "updated_at";
