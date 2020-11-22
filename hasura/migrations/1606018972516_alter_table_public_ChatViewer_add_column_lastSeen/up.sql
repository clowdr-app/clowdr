ALTER TABLE "public"."ChatViewer" ADD COLUMN "lastSeen" timestamptz NOT NULL DEFAULT now();
