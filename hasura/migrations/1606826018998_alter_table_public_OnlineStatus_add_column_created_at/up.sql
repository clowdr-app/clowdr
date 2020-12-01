ALTER TABLE "public"."OnlineStatus" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now();
