alter table "job_queues"."CustomEmailJob"
  add constraint "CustomEmailJob_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
