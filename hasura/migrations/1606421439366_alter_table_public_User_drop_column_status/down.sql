ALTER TABLE "public"."User" ADD COLUMN "status" text;
ALTER TABLE "public"."User" ALTER COLUMN "status" DROP NOT NULL;
ALTER TABLE "public"."User" ALTER COLUMN "status" SET DEFAULT 'active'::text;
