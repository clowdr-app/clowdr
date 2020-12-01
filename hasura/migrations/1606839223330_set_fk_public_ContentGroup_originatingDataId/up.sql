alter table "public"."ContentGroup"
           add constraint "ContentGroup_originatingDataId_fkey"
           foreign key ("originatingDataId")
           references "public"."OriginatingData"
           ("id") on update cascade on delete restrict;
