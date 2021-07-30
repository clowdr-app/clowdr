DROP INDEX IF EXISTS "room"."index_iswaiting";
DROP INDEX IF EXISTS "room"."room_ShuffleQueueEntry_isWaiting";

CREATE UNIQUE INDEX "room_ShuffleQueueEntry_isWaiting" ON "room"."ShuffleQueueEntry" ("shufflePeriodId", "registrantId", ("allocatedShuffleRoomId" IS NULL), "isExpired") WHERE "allocatedShuffleRoomId" IS NULL AND NOT "isExpired";
