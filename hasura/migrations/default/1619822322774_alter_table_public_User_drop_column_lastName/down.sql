ALTER TABLE "public"."User" ADD COLUMN "lastName" text;
ALTER TABLE "public"."User" ALTER COLUMN "lastName" DROP NOT NULL;
