alter table "video"."EventVonageSession"
  add constraint "EventVonageSession_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
