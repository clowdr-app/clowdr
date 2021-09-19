alter table "video"."RoomRtmpOutput" drop constraint "EventRtmpOutput_eventId_fkey",
  add constraint "RoomRtmpOutput_roomId_fkey"
  foreign key ("roomId")
  references "room"."Room"
  ("id") on update cascade on delete cascade;
