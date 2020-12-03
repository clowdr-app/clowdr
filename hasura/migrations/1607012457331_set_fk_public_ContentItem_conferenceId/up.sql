alter table "public"."ContentItem"
           add constraint "ContentItem_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
