alter table "public"."Invitation"
           add constraint "Invitation_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
