alter table "schedule"."StarredEvent" add constraint "StarredEvent_eventId_registrantId_key" unique ("eventId", "registrantId");
