alter table "schedule"."Event"
  add constraint "Event_sessionEventId_fkey"
  foreign key ("sessionEventId")
  references "schedule"."Event"
  ("id") on update cascade on delete cascade;
