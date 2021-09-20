alter table "schedule"."Continuation"
  add constraint "Continuation_fromShuffleQueue_fkey"
  foreign key ("fromShuffleQueue")
  references "room"."ShufflePeriod"
  ("id") on update cascade on delete cascade;
