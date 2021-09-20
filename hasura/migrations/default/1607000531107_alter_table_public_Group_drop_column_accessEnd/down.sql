ALTER TABLE "public"."Group" ADD COLUMN "accessEnd" timestamptz;
ALTER TABLE "public"."Group" ALTER COLUMN "accessEnd" DROP NOT NULL;
