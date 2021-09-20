alter table "chat"."ReadUpToIndex"
           add constraint "ReadUpToIndex_messageSId_fkey"
           foreign key ("messageSId")
           references "chat"."Message"
           ("sId") on update cascade on delete cascade;
