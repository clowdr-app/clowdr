alter table "content"."Element"
  add constraint "Element_requiredContentId_fkey"
  foreign key ("uploadableId")
  references "content"."UploadableElement"
  ("id") on update cascade on delete cascade;
