ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "validUpTo" timestamptz NOT NULL DEFAULT now();
