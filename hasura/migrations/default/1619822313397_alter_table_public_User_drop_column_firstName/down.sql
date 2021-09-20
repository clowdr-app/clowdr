ALTER TABLE "public"."User" ADD COLUMN "firstName" text;
ALTER TABLE "public"."User" ALTER COLUMN "firstName" DROP NOT NULL;
