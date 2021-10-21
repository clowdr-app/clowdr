alter table "collection"."ProgramPerson"
  add constraint "ProgramPerson_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
