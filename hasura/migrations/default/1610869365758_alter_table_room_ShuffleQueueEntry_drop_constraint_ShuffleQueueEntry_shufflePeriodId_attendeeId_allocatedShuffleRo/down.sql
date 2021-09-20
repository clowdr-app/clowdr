alter table "room"."ShuffleQueueEntry" add constraint "ShuffleQueueEntry_shufflePeriodId_attendeeId_allocatedShuffleRoomId_key" unique ("shufflePeriodId", "attendeeId", "allocatedShuffleRoomId");
