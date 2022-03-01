alter table "job_queues"."ImportJob" add column "outputs" jsonb
 not null default '{}';
