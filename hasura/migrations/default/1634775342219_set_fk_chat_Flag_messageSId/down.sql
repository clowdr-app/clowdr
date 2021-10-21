alter table "chat"."Flag" drop constraint "Flag_messageSId_fkey",
  add constraint "Flag_messageSId_fkey"
  foreign key ("messageSId")
  references "chat"."Message"
  ("sId") on update cascade on delete cascade;
