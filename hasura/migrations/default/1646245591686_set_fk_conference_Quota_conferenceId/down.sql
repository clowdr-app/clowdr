alter table "conference"."Quota" drop constraint "Quota_conferenceId_fkey",
  add constraint "Quota_id_fkey"
  foreign key ("id")
  references "conference"."Conference"
  ("id") on update cascade on delete restrict;
