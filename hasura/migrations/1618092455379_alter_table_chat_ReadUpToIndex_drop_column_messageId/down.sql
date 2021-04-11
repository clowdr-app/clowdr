ALTER TABLE "chat"."ReadUpToIndex" ADD COLUMN "messageId" int4;
ALTER TABLE "chat"."ReadUpToIndex" ALTER COLUMN "messageId" DROP NOT NULL;
ALTER TABLE "chat"."ReadUpToIndex" ALTER COLUMN "messageId" SET DEFAULT '-1'::integer;
