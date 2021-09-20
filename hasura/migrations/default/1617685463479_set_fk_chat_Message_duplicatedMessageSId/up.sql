alter table "chat"."Message" drop constraint "Message_duplicatedMessageSId_fkey",
             add constraint "Message_duplicatedMessageSId_fkey"
             foreign key ("duplicatedMessageSId")
             references "chat"."Message"
             ("sId") on update cascade on delete cascade;
