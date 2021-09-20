ALTER TABLE "system"."Configuration" ADD COLUMN "created_at" timestamptz NULL DEFAULT now();
