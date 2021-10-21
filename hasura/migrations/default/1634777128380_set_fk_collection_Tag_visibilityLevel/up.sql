alter table "collection"."Tag"
  add constraint "Tag_visibilityLevel_fkey"
  foreign key ("visibilityLevel")
  references "conference"."VisibilityLevel"
  ("name") on update cascade on delete restrict;
