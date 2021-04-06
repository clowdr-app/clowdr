alter table "chat"."Message" drop constraint "Message_duplicatedMessageSId_fkey",
          add constraint "Message_duplicatedMessageSId_fkey"
          foreign key ("type")
          references "chat"."MessageType"
          ("name")
          on update cascade
          on delete restrict;
