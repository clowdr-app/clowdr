alter table "public"."RequiredContentItem" drop constraint "RequiredContentItem_contentGroupId_fkey",
          add constraint "RequiredContentItem_contentGroupId_fkey"
          foreign key ("contentGroupId")
          references "public"."ContentGroup"
          ("id")
          on update cascade
          on delete restrict;
