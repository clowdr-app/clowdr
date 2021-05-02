DROP TRIGGER IF EXISTS "set_analytics_ContentItemStats_updated_at" ON "analytics"."ContentItemStats";
ALTER TABLE "analytics"."ContentItemStats" DROP COLUMN "updated_at";
