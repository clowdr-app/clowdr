alter table "job_queues"."UploadYouTubeVideoJob"
           add constraint "UploadYouTubeVideoJob_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
