alter table "public"."ContentItem" drop constraint "ContentItem_originatingDataId_fkey",
          add constraint "ContentItem_originatingDataId_fkey"
          foreign key ("originatingDataId")
          references "public"."OriginatingData"
          ("id")
          on update cascade
          on delete cascade;
