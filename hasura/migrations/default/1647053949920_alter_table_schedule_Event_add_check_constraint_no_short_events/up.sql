alter table "schedule"."Event" add constraint "no_short_events" check (EXTRACT(EPOCH FROM "scheduledEndTime" - "scheduledStartTime") >= (3 * 60));
