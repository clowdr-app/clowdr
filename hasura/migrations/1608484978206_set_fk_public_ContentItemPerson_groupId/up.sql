alter table "public"."ContentItemPerson" drop constraint "ContentItemPerson_itemId_fkey",
             add constraint "ContentItemPerson_groupId_fkey"
             foreign key ("groupId")
             references "public"."ContentGroup"
             ("id") on update cascade on delete cascade;
