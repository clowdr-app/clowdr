alter table "video"."EventVonageSession"
  add constraint "EventVonageSession_rtmpInputName_fkey"
  foreign key ("rtmpInputName")
  references "video"."RtmpInput"
  ("name") on update cascade on delete restrict;
