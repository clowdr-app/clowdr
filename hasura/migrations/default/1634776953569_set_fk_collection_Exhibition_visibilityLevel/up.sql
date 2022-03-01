alter table "collection"."Exhibition"
  add constraint "Exhibition_visibilityLevel_fkey"
  foreign key ("visibilityLevel")
  references "conference"."VisibilityLevel"
  ("name") on update cascade on delete restrict;
