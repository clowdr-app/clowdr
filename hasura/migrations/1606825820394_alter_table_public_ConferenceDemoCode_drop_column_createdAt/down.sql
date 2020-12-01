ALTER TABLE "public"."ConferenceDemoCode" ADD COLUMN "createdAt" timestamptz;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "public"."ConferenceDemoCode" ALTER COLUMN "createdAt" SET DEFAULT now();
