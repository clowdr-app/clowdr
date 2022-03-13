alter table "schedule"."Event" add constraint "mode_iff_not_in_session" check (("sessionEventId" IS NULL AND "modeName" IS NOT NULL) OR ("sessionEventId" IS NOT NULL AND "modeName" IS NULL));
