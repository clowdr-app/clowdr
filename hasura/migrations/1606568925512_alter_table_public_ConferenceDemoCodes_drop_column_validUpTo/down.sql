ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "validUpTo" timestamptz;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validUpTo" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validUpTo" SET DEFAULT now();
