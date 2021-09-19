alter table "video"."RoomRtmpOutput" drop constraint "RoomRtmpOutput_roomId_fkey",
  add constraint "EventRtmpOutput_eventId_fkey"
  foreign key ("roomId")
  references "schedule"."Event"
  ("id") on update cascade on delete cascade;
