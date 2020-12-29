ALTER TABLE "public"."Room" ADD COLUMN "presenterVonageSessionId" text;
ALTER TABLE "public"."Room" ALTER COLUMN "presenterVonageSessionId" DROP NOT NULL;
