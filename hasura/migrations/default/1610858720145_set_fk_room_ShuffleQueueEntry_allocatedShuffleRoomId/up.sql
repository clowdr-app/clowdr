alter table "room"."ShuffleQueueEntry"
           add constraint "ShuffleQueueEntry_allocatedShuffleRoomId_fkey"
           foreign key ("allocatedShuffleRoomId")
           references "room"."ShuffleRoom"
           ("id") on update cascade on delete restrict;
