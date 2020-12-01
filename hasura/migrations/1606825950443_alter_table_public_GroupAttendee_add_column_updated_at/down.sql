DROP TRIGGER IF EXISTS "set_public_GroupAttendee_updated_at" ON "public"."GroupAttendee";
ALTER TABLE "public"."GroupAttendee" DROP COLUMN "updated_at";
