ALTER TABLE "chat"."Message" ADD COLUMN "duplicatedMessageId" int4;
ALTER TABLE "chat"."Message" ALTER COLUMN "duplicatedMessageId" DROP NOT NULL;
ALTER TABLE "chat"."Message" ADD CONSTRAINT Message_duplicatedMessageId_fkey FOREIGN KEY (duplicatedMessageId) REFERENCES "chat"."Message" (id) ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "chat"."Message" ADD CONSTRAINT Message_duplicatedMessageId_key UNIQUE (duplicatedMessageId);
