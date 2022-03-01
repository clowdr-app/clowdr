alter table "job_queues"."ImportJob" alter column "outputs" set default '[]'::jsonb;
alter table "job_queues"."ImportJob" alter column "outputs" drop not null;
alter table "job_queues"."ImportJob" add column "outputs" jsonb;
