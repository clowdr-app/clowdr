alter table "chat"."Message"
           add constraint "Message_duplicatedMessageSId_fkey"
           foreign key ("duplicatedMessageSId")
           references "chat"."Message"
           ("sId") on update cascade on delete set null;
