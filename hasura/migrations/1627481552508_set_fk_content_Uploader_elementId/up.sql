alter table "content"."Uploader"
  add constraint "Uploader_elementId_fkey"
  foreign key ("elementId")
  references "content"."Element"
  ("id") on update cascade on delete cascade;
