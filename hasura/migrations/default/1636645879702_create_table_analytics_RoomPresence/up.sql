CREATE TABLE "analytics"."RoomPresence" ("roomId" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "count" bigint NOT NULL DEFAULT 0, "id" uuid NOT NULL DEFAULT gen_random_uuid(), PRIMARY KEY ("id") , FOREIGN KEY ("roomId") REFERENCES "room"."Room"("id") ON UPDATE cascade ON DELETE cascade);
CREATE EXTENSION IF NOT EXISTS pgcrypto;
