ALTER TABLE "public"."user" ADD COLUMN "username" text;
ALTER TABLE "public"."user" ALTER COLUMN "username" DROP NOT NULL;
