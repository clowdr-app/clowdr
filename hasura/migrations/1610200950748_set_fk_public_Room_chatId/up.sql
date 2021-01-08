alter table "public"."Room"
           add constraint "Room_chatId_fkey"
           foreign key ("chatId")
           references "chat"."Chat"
           ("id") on update cascade on delete restrict;
