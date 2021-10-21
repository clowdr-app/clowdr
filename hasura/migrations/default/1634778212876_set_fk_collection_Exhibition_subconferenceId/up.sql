alter table "collection"."Exhibition"
  add constraint "Exhibition_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
