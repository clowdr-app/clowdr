alter table "public"."Broadcast"
           add constraint "Broadcast_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
