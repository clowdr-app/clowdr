alter table "public"."Room"
  add constraint "Room_mediaLiveChannelId_fkey"
  foreign key ("mediaLiveChannelId")
  references "public"."MediaLiveChannel"
  ("id") on update cascade on delete set null;
