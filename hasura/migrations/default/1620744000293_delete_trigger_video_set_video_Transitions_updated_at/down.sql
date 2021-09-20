CREATE TRIGGER "set_video_Transitions_updated_at"
BEFORE UPDATE ON "video"."Transitions"
FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();COMMENT ON TRIGGER "set_video_Transitions_updated_at" ON "video"."Transitions"
IS E'trigger to set value of column "updated_at" to current timestamp on row update';
