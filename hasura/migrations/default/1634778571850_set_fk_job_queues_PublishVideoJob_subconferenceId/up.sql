alter table "job_queues"."PublishVideoJob"
  add constraint "PublishVideoJob_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
