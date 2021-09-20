alter table "public"."ContentItemPerson" drop constraint "ContentItemPerson_groupId_fkey",
          add constraint "ContentItemPerson_itemId_fkey"
          foreign key ("groupId")
          references "public"."ContentItem"
          ("id")
          on update cascade
          on delete cascade;
