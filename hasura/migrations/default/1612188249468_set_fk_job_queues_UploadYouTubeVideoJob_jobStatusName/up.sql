alter table "job_queues"."UploadYouTubeVideoJob"
           add constraint "UploadYouTubeVideoJob_jobStatusName_fkey"
           foreign key ("jobStatusName")
           references "public"."JobStatus"
           ("name") on update cascade on delete restrict;
