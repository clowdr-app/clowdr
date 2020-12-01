ALTER TABLE "public"."Group" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
