ALTER TABLE "analytics"."ContentElementStats" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
