DROP TRIGGER IF EXISTS "set_analytics_ContentElementStats_updated_at" ON "analytics"."ContentElementStats";
ALTER TABLE "analytics"."ContentElementStats" DROP COLUMN "updated_at";
