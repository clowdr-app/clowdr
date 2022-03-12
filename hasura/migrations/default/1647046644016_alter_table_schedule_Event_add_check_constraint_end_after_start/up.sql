alter table "schedule"."Event" add constraint "end_after_start" check ("scheduledEndTime" >= "scheduledStartTime");
