alter table "chat"."Message"
           add constraint "Message_duplicatedMessageId_fkey"
           foreign key ("duplicatedMessageId")
           references "chat"."Message"
           ("id") on update cascade on delete set null;
