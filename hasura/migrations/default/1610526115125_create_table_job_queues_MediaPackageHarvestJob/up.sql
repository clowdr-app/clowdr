CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "job_queues"."MediaPackageHarvestJob"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "eventId" uuid NOT NULL, "jobStatusName" text NOT NULL, "message" text NOT NULL, "mediaPackageHarvestJobId" text, "conferenceId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("jobStatusName") REFERENCES "public"."JobStatus"("name") ON UPDATE cascade ON DELETE restrict, UNIQUE ("mediaPackageHarvestJobId"));
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
CREATE TRIGGER "set_job_queues_MediaPackageHarvestJob_updated_at"
BEFORE UPDATE ON "job_queues"."MediaPackageHarvestJob"
FOR EACH ROW
EXECUTE PROCEDURE "job_queues"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_job_queues_MediaPackageHarvestJob_updated_at" ON "job_queues"."MediaPackageHarvestJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
