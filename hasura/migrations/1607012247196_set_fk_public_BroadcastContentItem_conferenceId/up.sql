alter table "public"."BroadcastContentItem"
           add constraint "BroadcastContentItem_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
