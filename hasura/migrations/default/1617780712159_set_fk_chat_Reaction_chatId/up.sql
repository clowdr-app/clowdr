alter table "chat"."Reaction"
           add constraint "Reaction_chatId_fkey"
           foreign key ("chatId")
           references "chat"."Chat"
           ("id") on update cascade on delete cascade;
