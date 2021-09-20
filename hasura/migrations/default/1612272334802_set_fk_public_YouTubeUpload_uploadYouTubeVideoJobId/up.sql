alter table "public"."YouTubeUpload"
           add constraint "YouTubeUpload_uploadYouTubeVideoJobId_fkey"
           foreign key ("uploadYouTubeVideoJobId")
           references "job_queues"."UploadYouTubeVideoJob"
           ("id") on update cascade on delete set null;
