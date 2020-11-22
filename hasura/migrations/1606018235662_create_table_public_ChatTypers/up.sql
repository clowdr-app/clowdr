CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ChatTypers"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chatId" uuid NOT NULL, "userId" text NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"));
