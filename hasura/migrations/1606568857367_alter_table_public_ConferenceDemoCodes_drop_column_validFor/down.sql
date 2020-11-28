ALTER TABLE "public"."ConferenceDemoCodes" ADD COLUMN "validFor" int8;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validFor" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCodes" ALTER COLUMN "validFor" SET DEFAULT 1209600000;
