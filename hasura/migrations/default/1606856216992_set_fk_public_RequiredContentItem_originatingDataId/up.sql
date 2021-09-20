alter table "public"."RequiredContentItem" drop constraint "RequiredContentItem_contentGroupId_fkey1",
             add constraint "RequiredContentItem_originatingDataId_fkey"
             foreign key ("originatingDataId")
             references "public"."OriginatingData"
             ("id") on update cascade on delete restrict;
