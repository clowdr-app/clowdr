alter table "video"."ImmediateSwitch"
  add constraint "ImmediateSwitch_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
