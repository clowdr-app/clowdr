CREATE TABLE "video"."MediaLiveChannelStatus" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "pipelinesRunningCount" numeric, "activeInputSwitchActionName" text, "activeInputAttachmentName" text, "channelStackId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("channelStackId") REFERENCES "video"."MediaLiveChannel"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("channelStackId"));
CREATE OR REPLACE FUNCTION "video"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_video_MediaLiveChannelStatus_updated_at"
BEFORE UPDATE ON "video"."MediaLiveChannelStatus"
FOR EACH ROW
EXECUTE PROCEDURE "video"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_video_MediaLiveChannelStatus_updated_at" ON "video"."MediaLiveChannelStatus" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
