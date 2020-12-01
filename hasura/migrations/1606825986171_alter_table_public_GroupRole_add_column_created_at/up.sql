ALTER TABLE "public"."GroupRole" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
