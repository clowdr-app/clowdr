alter table "room"."ShufflePeriod"
  add constraint "ShufflePeriod_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
