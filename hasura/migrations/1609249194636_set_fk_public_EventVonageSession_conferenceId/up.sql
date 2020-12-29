alter table "public"."EventVonageSession"
           add constraint "EventVonageSession_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
