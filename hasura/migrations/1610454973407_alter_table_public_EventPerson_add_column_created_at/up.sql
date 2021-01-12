ALTER TABLE "public"."EventPerson" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
