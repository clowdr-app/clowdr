CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "job_queues"."CombineVideosJob"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "data" jsonb NOT NULL, "createdByAttendeeId" uuid, "jobStatusName" text NOT NULL DEFAULT 'NEW', "conferenceId" UUID NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("createdByAttendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE set null, FOREIGN KEY ("jobStatusName") REFERENCES "public"."JobStatus"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade);
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
CREATE TRIGGER "set_job_queues_CombineVideosJob_updated_at"
BEFORE UPDATE ON "job_queues"."CombineVideosJob"
FOR EACH ROW
EXECUTE PROCEDURE "job_queues"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_job_queues_CombineVideosJob_updated_at" ON "job_queues"."CombineVideosJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
