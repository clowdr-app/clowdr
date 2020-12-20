alter table "public"."ContentItemPerson" add constraint "ContentItemPerson_roleName_personId_groupId_key" unique ("roleName", "personId", "groupId");
