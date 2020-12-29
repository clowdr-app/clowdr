alter table "public"."MediaLiveChannel"
           add constraint "MediaLiveChannel_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
