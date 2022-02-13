alter table "job_queues"."ImportJob" add column "progressMaximum" integer
 not null default '0';
