-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- CREATE INDEX "schedule_Continuation_fromEvent" ON "schedule"."Continuation" ("fromEvent");
CREATE INDEX "schedule_Continuation_fromShuffleQueue" ON "schedule"."Continuation" ("fromShuffleQueue");
