alter table "room"."ChimeMeeting"
  add constraint "ChimeMeeting_conferenceId_fkey"
  foreign key ("conferenceId")
  references "conference"."Conference"
  ("id") on update cascade on delete restrict;
