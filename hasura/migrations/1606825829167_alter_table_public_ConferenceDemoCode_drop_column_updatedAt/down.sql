ALTER TABLE "public"."ConferenceDemoCode" ADD COLUMN "updatedAt" timestamptz;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "updatedAt" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "updatedAt" SET DEFAULT now();
