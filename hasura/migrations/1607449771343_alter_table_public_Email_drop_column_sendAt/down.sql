ALTER TABLE "public"."Email" ADD COLUMN "sendAt" timestamptz;
ALTER TABLE "public"."Email" ALTER COLUMN "sendAt" DROP NOT NULL;
ALTER TABLE "public"."Email" ALTER COLUMN "sendAt" SET DEFAULT now();
