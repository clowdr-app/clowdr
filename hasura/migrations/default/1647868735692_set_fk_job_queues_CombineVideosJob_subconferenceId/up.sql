alter table "job_queues"."CombineVideosJob"
  add constraint "CombineVideosJob_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
