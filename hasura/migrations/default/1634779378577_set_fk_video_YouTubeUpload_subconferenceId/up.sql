alter table "video"."YouTubeUpload"
  add constraint "YouTubeUpload_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
