alter table "job_queues"."MediaPackageHarvestJob"
  add constraint "MediaPackageHarvestJob_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete set null;
