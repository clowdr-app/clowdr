alter table "public"."ContentItemPerson"
           add constraint "ContentItemPerson_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
