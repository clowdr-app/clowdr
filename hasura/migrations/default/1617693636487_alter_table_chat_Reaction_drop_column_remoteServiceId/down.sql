ALTER TABLE "chat"."Reaction" ADD COLUMN "remoteServiceId" text;
ALTER TABLE "chat"."Reaction" ALTER COLUMN "remoteServiceId" DROP NOT NULL;
