alter table "job_queues"."SubmissionRequestEmailJob"
  add constraint "SubmissionRequestEmailJob_personId_fkey"
  foreign key ("personId")
  references "collection"."ProgramPerson"
  ("id") on update cascade on delete cascade;
