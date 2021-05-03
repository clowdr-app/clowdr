CREATE EXTENSION IF NOT EXISTS pgcrypto;
ALTER TABLE "analytics"."RoomStats" ADD COLUMN "id" uuid NOT NULL DEFAULT gen_random_uuid();
