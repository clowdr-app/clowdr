alter table "video"."ImmediateSwitch"
  add constraint "ImmediateSwitch_conferenceId_fkey"
  foreign key ("conferenceId")
  references "conference"."Conference"
  ("id") on update cascade on delete cascade;
