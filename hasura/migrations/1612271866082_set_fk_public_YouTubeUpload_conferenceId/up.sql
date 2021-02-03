alter table "public"."YouTubeUpload"
           add constraint "YouTubeUpload_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
