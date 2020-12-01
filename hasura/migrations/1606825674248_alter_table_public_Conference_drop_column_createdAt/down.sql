ALTER TABLE "public"."Conference" ADD COLUMN "createdAt" timestamptz;
ALTER TABLE "public"."Conference" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE "public"."Conference" ALTER COLUMN "createdAt" SET DEFAULT now();
