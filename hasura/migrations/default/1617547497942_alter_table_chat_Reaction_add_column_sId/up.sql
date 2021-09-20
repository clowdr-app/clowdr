CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE "chat"."Reaction" ADD COLUMN "sId" uuid NOT NULL UNIQUE DEFAULT gen_random_uuid();
