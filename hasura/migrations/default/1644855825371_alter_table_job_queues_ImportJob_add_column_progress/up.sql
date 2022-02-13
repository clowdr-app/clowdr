alter table "job_queues"."ImportJob" add column "progress" integer
 not null default '0';
