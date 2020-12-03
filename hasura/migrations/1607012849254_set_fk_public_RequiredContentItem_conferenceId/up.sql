alter table "public"."RequiredContentItem"
           add constraint "RequiredContentItem_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
