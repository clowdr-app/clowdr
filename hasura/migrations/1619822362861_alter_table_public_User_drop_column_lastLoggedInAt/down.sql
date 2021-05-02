ALTER TABLE "public"."User" ADD COLUMN "lastLoggedInAt" timestamptz;
ALTER TABLE "public"."User" ALTER COLUMN "lastLoggedInAt" DROP NOT NULL;
ALTER TABLE "public"."User" ALTER COLUMN "lastLoggedInAt" SET DEFAULT now();
