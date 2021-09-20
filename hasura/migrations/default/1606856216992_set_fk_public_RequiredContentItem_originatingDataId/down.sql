alter table "public"."RequiredContentItem" drop constraint "RequiredContentItem_originatingDataId_fkey",
          add constraint "RequiredContentItem_contentGroupId_fkey1"
          foreign key ("contentGroupId")
          references "public"."OriginatingData"
          ("id")
          on update cascade
          on delete restrict;
