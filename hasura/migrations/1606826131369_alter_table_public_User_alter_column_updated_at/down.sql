ALTER TABLE "public"."User" ALTER COLUMN "updated_at" TYPE timestamp with time zone;
ALTER TABLE "public"."User" ALTER COLUMN "updated_at" DROP NOT NULL;
