alter table "public"."MediaLiveChannel"
  add constraint "MediaLiveChannel_roomId_fkey"
  foreign key ("roomId")
  references "public"."Room"
  ("id") on update cascade on delete restrict;
