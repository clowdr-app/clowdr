ALTER TABLE "job_queues"."InvitationEmailJob" ADD COLUMN "updated_at" timestamptz NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "job_queues"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_job_queues_InvitationEmailJob_updated_at"
BEFORE UPDATE ON "job_queues"."InvitationEmailJob"
FOR EACH ROW
EXECUTE PROCEDURE "job_queues"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_job_queues_InvitationEmailJob_updated_at" ON "job_queues"."InvitationEmailJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
