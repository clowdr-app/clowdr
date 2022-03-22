comment on column "video"."VonageParticipantStream"."subconferenceId" is E'Current streams in Vonage sessions.';
alter table "video"."VonageParticipantStream"
  add constraint "VonageParticipantStream_subconferenceId_fkey"
  foreign key (subconferenceId)
  references "conference"."Subconference"
  (id) on update cascade on delete cascade;
alter table "video"."VonageParticipantStream" alter column "subconferenceId" drop not null;
alter table "video"."VonageParticipantStream" add column "subconferenceId" uuid;
