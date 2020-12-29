alter table "public"."BroadcastContentItem"
           add constraint "BroadcastContentItem_eventId_fkey"
           foreign key ("eventId")
           references "public"."Event"
           ("id") on update cascade on delete cascade;
