alter table "job_queues"."UploadYouTubeVideoJob"
  add constraint "UploadYouTubeVideoJob_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
