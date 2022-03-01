alter table "content"."Element"
  add constraint "Element_visibilityLevel_fkey"
  foreign key ("visibilityLevel")
  references "conference"."VisibilityLevel"
  ("name") on update cascade on delete restrict;
