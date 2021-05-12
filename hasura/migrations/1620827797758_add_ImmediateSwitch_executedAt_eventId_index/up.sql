CREATE INDEX "video_ImmediateSwitch_executedAt_eventId"
    ON video."ImmediateSwitch" USING btree
    ("executedAt" DESC NULLS LAST, "eventId" ASC NULLS LAST)
;
