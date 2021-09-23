CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."ContentItemPerson"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "personId" uuid NOT NULL, "itemId" uuid NOT NULL, "priority" integer, "roleName" Text NOT NULL DEFAULT 'AUTHOR', PRIMARY KEY ("id") , FOREIGN KEY ("personId") REFERENCES "public"."ContentPerson"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("itemId") REFERENCES "public"."ContentItem"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("id"));