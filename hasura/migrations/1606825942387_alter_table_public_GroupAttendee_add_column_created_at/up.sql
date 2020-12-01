ALTER TABLE "public"."GroupAttendee" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
