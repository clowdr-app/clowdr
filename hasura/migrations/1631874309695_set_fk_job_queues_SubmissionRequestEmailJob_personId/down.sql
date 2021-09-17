alter table "job_queues"."SubmissionRequestEmailJob" drop constraint "SubmissionRequestEmailJob_personId_fkey",
  add constraint "SubmissionRequestEmailJob_personId_fkey"
  foreign key ("uploaderId")
  references "content"."Uploader"
  ("id") on update cascade on delete cascade;
