alter table "public"."ContentGroup" drop constraint "ContentGroup_chatId_fkey",
          add constraint "ContentGroup_chatId_fkey"
          foreign key ("chatId")
          references "chat"."Chat"
          ("id")
          on update cascade
          on delete set null;
