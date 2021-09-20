alter table "public"."BroadcastContentItem"
           add constraint "BroadcastContentItem_inputTypeName_fkey"
           foreign key ("inputTypeName")
           references "public"."InputType"
           ("name") on update cascade on delete restrict;
