CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ConferenceDemoCodes"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "createdAt" timestamptz NOT NULL DEFAULT now(), "validFor" bigint NOT NULL DEFAULT 1209600000, "note" text, PRIMARY KEY ("id") , UNIQUE ("id"), CONSTRAINT "validFor > 0" CHECK ("validFor" > 0));
