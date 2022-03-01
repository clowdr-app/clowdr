alter table "conference"."Subconference"
  add constraint "Subconference_conferenceId_fkey"
  foreign key ("conferenceId")
  references "conference"."Conference"
  ("id") on update cascade on delete cascade;
