CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Role"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "conference" uuid NOT NULL, "name" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("conference", "name"));
