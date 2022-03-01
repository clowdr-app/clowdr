alter table "content"."Item"
  add constraint "Item_visibilityLevel_fkey"
  foreign key ("visibilityLevel")
  references "conference"."VisibilityLevel"
  ("name") on update cascade on delete restrict;
