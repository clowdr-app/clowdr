comment on column "video"."EventParticipantStream"."eventId" is E'Current streams in Vonage sessions.';
alter table "video"."EventParticipantStream" add constraint "EventParticipantStream_eventId_registrantId_vonageStreamId_key" unique (vonageStreamId, registrantId, eventId);
alter table "video"."EventParticipantStream"
  add constraint "EventParticipantStream_eventId_fkey"
  foreign key (eventId)
  references "schedule"."Event"
  (id) on update cascade on delete cascade;
alter table "video"."EventParticipantStream" alter column "eventId" drop not null;
alter table "video"."EventParticipantStream" add column "eventId" uuid;
