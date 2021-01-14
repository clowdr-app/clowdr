alter table "chat"."Chat"
           add constraint "Chat_duplicateToId_fkey"
           foreign key ("duplicateToId")
           references "chat"."Chat"
           ("id") on update cascade on delete set null;
