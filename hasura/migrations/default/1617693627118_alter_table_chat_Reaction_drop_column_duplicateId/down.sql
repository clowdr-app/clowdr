ALTER TABLE "chat"."Reaction" ADD COLUMN "duplicateId" int4;
ALTER TABLE "chat"."Reaction" ALTER COLUMN "duplicateId" DROP NOT NULL;
