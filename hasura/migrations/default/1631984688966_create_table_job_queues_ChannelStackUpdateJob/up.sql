CREATE TABLE "job_queues"."ChannelStackUpdateJob" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "channelStackId" uuid NOT NULL, "jobStatusName" text NOT NULL, "cloudFormationStackArn" text NOT NULL, "mediaLiveChannelId" text NOT NULL, "message" text, "oldRtmpOutputUri" text, "oldRtmpOutputStreamKey" text, "oldRtmpOutputDestinationId" text, "newRtmpOutputUri" text, "newRtmpOutputStreamKey" text, PRIMARY KEY ("id") , FOREIGN KEY ("jobStatusName") REFERENCES "video"."JobStatus"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("channelStackId") REFERENCES "video"."ChannelStack"("id") ON UPDATE cascade ON DELETE set null);
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
CREATE TRIGGER "set_job_queues_ChannelStackUpdateJob_updated_at"
BEFORE UPDATE ON "job_queues"."ChannelStackUpdateJob"
FOR EACH ROW
EXECUTE PROCEDURE "job_queues"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_job_queues_ChannelStackUpdateJob_updated_at" ON "job_queues"."ChannelStackUpdateJob" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
