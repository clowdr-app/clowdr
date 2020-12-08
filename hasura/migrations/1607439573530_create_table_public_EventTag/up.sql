CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."EventTag"("eventId" uuid NOT NULL, "tagId" UUID NOT NULL, "id" uuid NOT NULL DEFAULT gen_random_uuid(), PRIMARY KEY ("id") , FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON UPDATE cascade ON DELETE cascade);
