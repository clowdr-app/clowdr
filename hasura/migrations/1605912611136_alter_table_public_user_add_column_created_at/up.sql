ALTER TABLE "public"."user" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
