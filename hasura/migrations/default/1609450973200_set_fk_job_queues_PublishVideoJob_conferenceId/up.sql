alter table "job_queues"."PublishVideoJob"
           add constraint "PublishVideoJob_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
