alter table "public"."RoomParticipant"
           add constraint "RoomParticipant_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
