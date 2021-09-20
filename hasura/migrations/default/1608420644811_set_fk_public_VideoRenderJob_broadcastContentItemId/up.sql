alter table "public"."VideoRenderJob"
           add constraint "VideoRenderJob_broadcastContentItemId_fkey"
           foreign key ("broadcastContentItemId")
           references "public"."BroadcastContentItem"
           ("id") on update cascade on delete cascade;
