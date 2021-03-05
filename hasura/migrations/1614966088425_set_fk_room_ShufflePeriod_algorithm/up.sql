alter table "room"."ShufflePeriod"
           add constraint "ShufflePeriod_algorithm_fkey"
           foreign key ("algorithm")
           references "room"."ShuffleAlgorithm"
           ("name") on update cascade on delete restrict;
