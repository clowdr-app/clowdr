alter table "public"."Uploader"
           add constraint "Uploader_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
