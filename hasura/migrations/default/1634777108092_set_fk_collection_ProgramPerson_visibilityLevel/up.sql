alter table "collection"."ProgramPerson"
  add constraint "ProgramPerson_visibilityLevel_fkey"
  foreign key ("visibilityLevel")
  references "conference"."VisibilityLevel"
  ("name") on update cascade on delete restrict;
