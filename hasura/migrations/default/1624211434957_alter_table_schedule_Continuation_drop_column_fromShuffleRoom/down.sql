comment on column "schedule"."Continuation"."fromShuffleRoom" is E'A continuation from the end of an event or shuffle room to the next thing. Enables organisers to create a guided flow for attendees. It is possible to specify multiple continuations from the same point, giving attendees a choice of where to go.';
alter table "schedule"."Continuation" alter column "fromShuffleRoom" drop not null;
alter table "schedule"."Continuation" add column "fromShuffleRoom" int8;
