alter table "schedule"."Event" alter column "startTime" drop not null;
alter table "schedule"."Event" rename column "startTime" to "scheduledStartTime";
