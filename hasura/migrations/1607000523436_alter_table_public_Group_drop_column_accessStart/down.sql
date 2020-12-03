ALTER TABLE "public"."Group" ADD COLUMN "accessStart" timestamptz;
ALTER TABLE "public"."Group" ALTER COLUMN "accessStart" DROP NOT NULL;
