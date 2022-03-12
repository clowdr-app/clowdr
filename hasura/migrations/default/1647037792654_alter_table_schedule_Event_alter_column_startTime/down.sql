alter table "schedule"."Event" rename column "scheduledStartTime" to "startTime";
alter table "schedule"."Event" alter column "startTime" set not null;
