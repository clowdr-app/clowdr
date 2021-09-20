alter table "public"."EventPerson"
           add constraint "EventPerson_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
