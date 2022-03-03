alter table "conference"."Quota" drop constraint "Quota_id_fkey",
  add constraint "Quota_conferenceId_fkey"
  foreign key ("conferenceId")
  references "conference"."Conference"
  ("id") on update cascade on delete restrict;
