alter table "public"."Transitions"
           add constraint "Transitions_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
