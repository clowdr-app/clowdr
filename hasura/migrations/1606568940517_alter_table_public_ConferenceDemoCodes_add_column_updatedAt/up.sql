ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "updatedAt" timestamptz NOT NULL DEFAULT now();
