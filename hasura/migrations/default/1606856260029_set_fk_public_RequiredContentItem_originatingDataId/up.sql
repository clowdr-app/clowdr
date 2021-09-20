alter table "public"."RequiredContentItem"
           add constraint "RequiredContentItem_originatingDataId_fkey"
           foreign key ("originatingDataId")
           references "public"."OriginatingData"
           ("id") on update cascade on delete restrict;
