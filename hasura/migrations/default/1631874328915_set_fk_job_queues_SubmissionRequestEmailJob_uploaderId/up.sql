alter table "job_queues"."SubmissionRequestEmailJob" drop constraint "SubmissionRequestEmailJob_uploaderId_fkey",
  add constraint "SubmissionRequestEmailJob_uploaderId_fkey"
  foreign key ("uploaderId")
  references "content"."Uploader"
  ("id") on update cascade on delete set null;
