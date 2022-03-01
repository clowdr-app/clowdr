alter table "conference"."OriginatingData"
  add constraint "OriginatingData_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
