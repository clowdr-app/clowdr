ALTER TABLE "chat"."Reaction" ADD COLUMN "messageId" int4;
ALTER TABLE "chat"."Reaction" ALTER COLUMN "messageId" DROP NOT NULL;
ALTER TABLE "chat"."Reaction" ADD CONSTRAINT Reaction_messageId_fkey FOREIGN KEY (messageId) REFERENCES "chat"."Message" (id) ON DELETE cascade ON UPDATE cascade;
