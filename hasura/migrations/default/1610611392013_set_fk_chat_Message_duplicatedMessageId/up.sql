alter table "chat"."Message" drop constraint "Message_duplicatedMessageId_fkey",
             add constraint "Message_duplicatedMessageId_fkey"
             foreign key ("duplicatedMessageId")
             references "chat"."Message"
             ("id") on update cascade on delete cascade;
