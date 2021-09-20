alter table "chat"."Pin"
           add constraint "Pin_chatId_fkey"
           foreign key ("chatId")
           references "chat"."Chat"
           ("id") on update cascade on delete cascade;
