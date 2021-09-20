ALTER TABLE "chat"."Message" ADD COLUMN "remoteServiceId" text;
ALTER TABLE "chat"."Message" ALTER COLUMN "remoteServiceId" DROP NOT NULL;
