alter table "public"."EventPerson" drop constraint "EventPerson_eventId_personId_roleName_key";
alter table "public"."EventPerson" add constraint "EventPerson_eventId_attendeeId_roleName_key" unique ("eventId", "attendeeId", "roleName");
