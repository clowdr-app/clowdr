CREATE INDEX "ShufflePeriod_conferenceId" ON "room"."ShufflePeriod" ("conferenceId");
CREATE INDEX "ShufflePeriod_startAt" ON "room"."ShufflePeriod" ("startAt");
CREATE INDEX "ShufflePeriod_endAt" ON "room"."ShufflePeriod" ("endAt");

CREATE INDEX "ShuffleQueueEntry_shufflePeriodId" ON "room"."ShuffleQueueEntry" ("shufflePeriodId");
CREATE INDEX "ShuffleQueueEntry_attendeeId" ON "room"."ShuffleQueueEntry" ("attendeeId");

CREATE INDEX "ShuffleRoom_shufflePeriodId" ON "room"."ShuffleRoom" ("shufflePeriodId");
CREATE INDEX "ShuffleRoom_roomId" ON "room"."ShuffleRoom" ("roomId");
