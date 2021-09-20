CREATE TRIGGER "set_schedule_Event_timings_updated_at"
    BEFORE UPDATE OF "startTime", "durationSeconds"
    ON schedule."Event"
    FOR EACH ROW
    EXECUTE PROCEDURE schedule.set_current_timestamp_timings_updated_at();

COMMENT ON TRIGGER "set_schedule_Event_timings_updated_at" ON schedule."Event"
    IS 'trigger to set value of column "timings_updated_at" to current timestamp on row startTime or durationSeconds update';
