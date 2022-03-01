alter table "room"."ChimeMeeting"
  add constraint "ChimeMeeting_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
