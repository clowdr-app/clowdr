alter table "public"."Room"
  add constraint "Room_videoRoomBackendName_fkey"
  foreign key ("videoRoomBackendName")
  references "room"."VideoRoomBackend"
  ("name") on update cascade on delete restrict;
