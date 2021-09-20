alter table "public"."EventVonageSession"
           add constraint "EventVonageSession_eventId_fkey"
           foreign key ("eventId")
           references "public"."Event"
           ("id") on update cascade on delete cascade;
