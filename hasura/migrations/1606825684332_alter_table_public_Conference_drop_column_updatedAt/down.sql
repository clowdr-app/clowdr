ALTER TABLE "public"."Conference" ADD COLUMN "updatedAt" timestamptz;
ALTER TABLE "public"."Conference" ALTER COLUMN "updatedAt" DROP NOT NULL;
ALTER TABLE "public"."Conference" ALTER COLUMN "updatedAt" SET DEFAULT now();
