alter table "public"."Tag"
           add constraint "Tag_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
