alter table "chat"."Chat"
  add constraint "Chat_subconferenceId_fkey"
  foreign key ("subconferenceId")
  references "conference"."Subconference"
  ("id") on update cascade on delete cascade;
