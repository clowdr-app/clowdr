alter table "video"."MediaLiveChannelStatus"
  add constraint "MediaLiveChannelStatus_conferenceId_fkey"
  foreign key ("conferenceId")
  references "conference"."Conference"
  ("id") on update cascade on delete cascade;
