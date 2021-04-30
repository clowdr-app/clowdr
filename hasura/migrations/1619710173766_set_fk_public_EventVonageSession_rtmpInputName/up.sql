alter table "public"."EventVonageSession"
  add constraint "EventVonageSession_rtmpInputName_fkey"
  foreign key ("rtmpInputName")
  references "public"."RtmpInput"
  ("name") on update cascade on delete restrict;
