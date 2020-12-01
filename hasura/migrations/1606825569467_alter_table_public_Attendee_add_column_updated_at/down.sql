DROP TRIGGER IF EXISTS "set_public_Attendee_updated_at" ON "public"."Attendee";
ALTER TABLE "public"."Attendee" DROP COLUMN "updated_at";
