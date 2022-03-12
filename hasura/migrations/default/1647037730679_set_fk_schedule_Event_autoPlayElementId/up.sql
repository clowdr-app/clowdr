alter table "schedule"."Event"
  add constraint "Event_autoPlayElementId_fkey"
  foreign key ("autoPlayElementId")
  references "content"."Element"
  ("id") on update cascade on delete set null;
