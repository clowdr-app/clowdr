CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE "analytics"."ContentElementStats" ADD COLUMN "id" uuid NOT NULL UNIQUE DEFAULT gen_random_uuid();
