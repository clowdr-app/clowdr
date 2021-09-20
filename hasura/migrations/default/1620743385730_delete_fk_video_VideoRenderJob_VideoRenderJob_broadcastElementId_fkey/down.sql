alter table "video"."VideoRenderJob"
  add constraint "VideoRenderJob_broadcastElementId_fkey"
  foreign key ("broadcastElementId")
  references "video"."BroadcastElement"
  ("id") on update cascade on delete cascade;
