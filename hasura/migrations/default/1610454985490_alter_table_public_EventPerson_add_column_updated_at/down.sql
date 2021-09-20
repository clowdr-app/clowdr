DROP TRIGGER IF EXISTS "set_public_EventPerson_updated_at" ON "public"."EventPerson";
ALTER TABLE "public"."EventPerson" DROP COLUMN "updated_at";
