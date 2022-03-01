alter table "registrant"."Group"
  add constraint "Group_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
