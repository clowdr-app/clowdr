CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Broadcast"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "to" text NOT NULL, "data" jsonb NOT NULL, "eventId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE cascade ON DELETE restrict);
