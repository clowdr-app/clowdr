alter table "job_queues"."SubmissionRequestEmailJob" alter column "subconferenceId" drop not null;
alter table "job_queues"."SubmissionRequestEmailJob" add column "subconferenceId" uuid;
