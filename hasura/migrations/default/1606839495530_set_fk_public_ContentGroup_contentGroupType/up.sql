alter table "public"."ContentGroup"
           add constraint "ContentGroup_contentGroupType_fkey"
           foreign key ("contentGroupType")
           references "public"."ContentGroupType"
           ("name") on update cascade on delete restrict;
