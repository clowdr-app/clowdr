alter table "video"."VonageSessionLayout"
  add constraint "VonageSessionLayout_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
