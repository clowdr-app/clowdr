alter table "video"."EventParticipantStream" add column "vonageSessionId" text
 not null unique;
