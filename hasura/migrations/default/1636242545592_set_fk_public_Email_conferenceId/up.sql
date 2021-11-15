alter table "public"."Email"
  add constraint "Email_conferenceId_fkey"
  foreign key ("conferenceId")
  references "conference"."Conference"
  ("id") on update cascade on delete cascade;
