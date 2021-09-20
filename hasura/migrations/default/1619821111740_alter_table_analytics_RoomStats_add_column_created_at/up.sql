ALTER TABLE "analytics"."RoomStats" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
