ALTER TABLE "public"."EventPerson" ADD COLUMN "affiliation" text;
ALTER TABLE "public"."EventPerson" ALTER COLUMN "affiliation" DROP NOT NULL;
