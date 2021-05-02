DROP TRIGGER IF EXISTS "set_analytics_RoomStats_updated_at" ON "analytics"."RoomStats";
ALTER TABLE "analytics"."RoomStats" DROP COLUMN "updated_at";
