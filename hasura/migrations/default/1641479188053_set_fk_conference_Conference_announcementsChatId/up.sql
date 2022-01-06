alter table "conference"."Conference"
  add constraint "Conference_announcementsChatId_fkey"
  foreign key ("announcementsChatId")
  references "chat"."Chat"
  ("id") on update cascade on delete cascade;
