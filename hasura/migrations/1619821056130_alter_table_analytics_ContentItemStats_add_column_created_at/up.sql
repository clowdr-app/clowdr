ALTER TABLE "analytics"."ContentItemStats" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
