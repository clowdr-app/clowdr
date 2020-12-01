ALTER TABLE "public"."RequiredContentItem" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
