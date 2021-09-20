CREATE UNIQUE INDEX index_isWaiting ON "room"."ShuffleQueueEntry" ("shufflePeriodId", "attendeeId", ("allocatedShuffleRoomId" IS NULL)) WHERE "allocatedShuffleRoomId" IS NULL;
