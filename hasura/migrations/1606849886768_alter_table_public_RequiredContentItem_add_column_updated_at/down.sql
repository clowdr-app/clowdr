DROP TRIGGER IF EXISTS "set_public_RequiredContentItem_updated_at" ON "public"."RequiredContentItem";
ALTER TABLE "public"."RequiredContentItem" DROP COLUMN "updated_at";
