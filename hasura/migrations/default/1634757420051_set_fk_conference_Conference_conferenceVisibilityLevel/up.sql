alter table "conference"."Conference"
  add constraint "Conference_conferenceVisibilityLevel_fkey"
  foreign key ("conferenceVisibilityLevel")
  references "conference"."VisibilityLevel"
  ("name") on update cascade on delete restrict;
