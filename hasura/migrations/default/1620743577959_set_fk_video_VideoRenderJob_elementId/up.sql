alter table "video"."VideoRenderJob"
  add constraint "VideoRenderJob_elementId_fkey"
  foreign key ("elementId")
  references "content"."Element"
  ("id") on update cascade on delete cascade;
