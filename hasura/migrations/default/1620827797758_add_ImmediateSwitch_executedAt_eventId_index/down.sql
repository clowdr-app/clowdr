-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- CREATE INDEX "video_ImmediateSwitch_executedAt_eventId"
    ON video."ImmediateSwitch" USING btree
    ("executedAt" DESC NULLS LAST, "eventId" ASC NULLS LAST)
;
