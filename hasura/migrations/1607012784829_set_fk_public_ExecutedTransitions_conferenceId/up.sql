alter table "public"."ExecutedTransitions"
           add constraint "ExecutedTransitions_conferenceId_fkey"
           foreign key ("conferenceId")
           references "public"."Conference"
           ("id") on update cascade on delete cascade;
