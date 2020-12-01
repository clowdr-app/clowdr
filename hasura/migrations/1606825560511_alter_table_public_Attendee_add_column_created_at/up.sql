ALTER TABLE "public"."Attendee" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
