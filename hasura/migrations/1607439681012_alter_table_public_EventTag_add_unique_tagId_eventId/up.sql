alter table "public"."EventTag" add constraint "EventTag_tagId_eventId_key" unique ("tagId", "eventId");
