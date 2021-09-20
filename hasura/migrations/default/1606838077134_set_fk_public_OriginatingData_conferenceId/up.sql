alter table "public"."OriginatingData"
           add constraint "OriginatingData_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
