ALTER TABLE "chat"."ReadUpToIndex" ADD COLUMN "notifiedUpToMessageId" int4;
ALTER TABLE "chat"."ReadUpToIndex" ALTER COLUMN "notifiedUpToMessageId" DROP NOT NULL;
ALTER TABLE "chat"."ReadUpToIndex" ALTER COLUMN "notifiedUpToMessageId" SET DEFAULT '-1'::integer;
