CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE "analytics"."ContentItemStats" ADD COLUMN "id" uuid NOT NULL DEFAULT gen_random_uuid();
