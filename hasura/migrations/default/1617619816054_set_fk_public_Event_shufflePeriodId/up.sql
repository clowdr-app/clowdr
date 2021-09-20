alter table "public"."Event"
           add constraint "Event_shufflePeriodId_fkey"
           foreign key ("shufflePeriodId")
           references "room"."ShufflePeriod"
           ("id") on update cascade on delete restrict;
