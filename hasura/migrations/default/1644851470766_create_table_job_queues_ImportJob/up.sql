CREATE TABLE "job_queues"."ImportJob" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "status" text DEFAULT 'ongoing', "data" jsonb NOT NULL, "options" jsonb NOT NULL, "createdBy" uuid, "completed_at" timestamptz, "conferenceId" uuid NOT NULL, "subconferenceId" uuid, "errors" jsonb, PRIMARY KEY ("id") , FOREIGN KEY ("createdBy") REFERENCES "registrant"."Registrant"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("conferenceId") REFERENCES "conference"."Conference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("subconferenceId") REFERENCES "conference"."Subconference"("id") ON UPDATE cascade ON DELETE set null, UNIQUE ("conferenceId", "subconferenceId", "status"));COMMENT ON TABLE "job_queues"."ImportJob" IS E'If status is null, it means the job has completed.';
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
CREATE TRIGGER "set_job_queues_ImportJob_updated_at"
BEFORE UPDATE ON "job_queues"."ImportJob"
FOR EACH ROW
EXECUTE PROCEDURE "job_queues"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_job_queues_ImportJob_updated_at" ON "job_queues"."ImportJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
