alter table "job_queues"."SubmissionRequestEmailJob"
  add constraint "SubmissionRequestEmailJob_uploaderId_fkey"
  foreign key (uploaderId)
  references "content"."Uploader"
  (id) on update cascade on delete set null;
alter table "job_queues"."SubmissionRequestEmailJob" alter column "uploaderId" drop not null;
alter table "job_queues"."SubmissionRequestEmailJob" add column "uploaderId" uuid;
