CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."OnlineStatus"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" text NOT NULL, "lastSeen" timestamptz NOT NULL DEFAULT now(), "isIncognito" boolean NOT NULL DEFAULT false, PRIMARY KEY ("id") , FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"), UNIQUE ("userId"));
