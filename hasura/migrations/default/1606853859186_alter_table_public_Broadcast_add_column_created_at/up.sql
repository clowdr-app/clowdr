ALTER TABLE "public"."Broadcast" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
