ALTER TABLE "chat"."Flag" ADD COLUMN "messageId" int4;
ALTER TABLE "chat"."Flag" ALTER COLUMN "messageId" DROP NOT NULL;
ALTER TABLE "chat"."Flag" ADD CONSTRAINT Flag_messageId_fkey FOREIGN KEY (messageId) REFERENCES "chat"."Message" (id) ON DELETE cascade ON UPDATE cascade;
