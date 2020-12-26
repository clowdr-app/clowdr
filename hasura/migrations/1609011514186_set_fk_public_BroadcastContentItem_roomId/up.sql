alter table "public"."BroadcastContentItem"
           add constraint "BroadcastContentItem_roomId_fkey"
           foreign key ("roomId")
           references "public"."Room"
           ("id") on update cascade on delete cascade;
