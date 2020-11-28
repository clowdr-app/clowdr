ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "used" bool;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "used" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "used" SET DEFAULT false;
