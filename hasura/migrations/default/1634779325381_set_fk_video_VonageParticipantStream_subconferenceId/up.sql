alter table "video"."VonageParticipantStream"
  add constraint "VonageParticipantStream_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
