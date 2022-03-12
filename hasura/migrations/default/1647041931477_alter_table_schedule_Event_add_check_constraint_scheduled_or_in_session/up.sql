alter table "schedule"."Event" add constraint "scheduled_or_in_session" check (("sessionEventId" IS NOT NULL) OR ("scheduledStartTime" IS NOT NULL));
