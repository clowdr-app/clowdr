ALTER TABLE "public"."Conference" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
