ALTER TABLE "public"."ContentGroup" ADD COLUMN "originatingId" text;
ALTER TABLE "public"."ContentGroup" ALTER COLUMN "originatingId" DROP NOT NULL;
