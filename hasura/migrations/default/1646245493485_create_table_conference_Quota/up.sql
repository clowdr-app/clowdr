CREATE TABLE "conference"."Quota" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "conferenceId" UUID NOT NULL, "maxSubconferences" integer NOT NULL DEFAULT 0, "maxStreamingEventTotalMinutes" integer NOT NULL DEFAULT 7200, "maxStreamingEventIndividualMinutes" integer NOT NULL DEFAULT 360, "maxVideoChatEventTotalMinutes" integer NOT NULL DEFAULT 7200, "maxVideoChatEventIndividualMinutes" integer NOT NULL DEFAULT 360, "maxRegistrants" integer NOT NULL DEFAULT 5, "maxVideoChatNonEventTotalMinutesConsumed" integer NOT NULL DEFAULT 300, "maxSupportMeetingMinutes" integer NOT NULL DEFAULT 0, "maxStreamingProgramRooms" integer NOT NULL DEFAULT 2, "maxNonStreamingProgramRooms" integer NOT NULL DEFAULT 8, "maxPublicSocialRooms" integer NOT NULL DEFAULT 20, "maxContentItems" integer NOT NULL DEFAULT 400, "maxMediaElementsPerContentItem" integer NOT NULL DEFAULT 2, "maxNonMediaElementsPerContentItem" integer NOT NULL DEFAULT 20, "maxMediaElementsPerSponsor" integer NOT NULL DEFAULT 4, "maxNonMediaElementsPerSponsor" integer NOT NULL DEFAULT 20, "areStreamingEventsAllowed" boolean NOT NULL DEFAULT true, "areVideoChatEventsAllowed" boolean NOT NULL DEFAULT true, PRIMARY KEY ("id") , FOREIGN KEY ("id") REFERENCES "conference"."Conference"("id") ON UPDATE cascade ON DELETE restrict, UNIQUE ("conferenceId"), CONSTRAINT "maxStreamingEventTotalMinutes_GTE0" CHECK ("maxStreamingEventTotalMinutes" >= 0), CONSTRAINT "maxStreamingEventIndividualMinutes_GTE0" CHECK ("maxStreamingEventIndividualMinutes" >= 0), CONSTRAINT "maxVideoChatEventTotalMinutes_GTE0" CHECK ("maxVideoChatEventTotalMinutes" >= 0), CONSTRAINT "maxVideoChatEventIndividualMinutes_GTE0" CHECK ("maxVideoChatEventIndividualMinutes" >= 0), CONSTRAINT "maxRegistrants_GTE0" CHECK ("maxRegistrants" >= 0), CONSTRAINT "maxVideoChatNonEventTotalMinutesConsumed_GTE0" CHECK ("maxVideoChatNonEventTotalMinutesConsumed" >= 0), CONSTRAINT "maxSupportMeetingMinutes_GTE0" CHECK ("maxSupportMeetingMinutes" >= 0), CONSTRAINT "maxStreamingProgramRooms_GTE0" CHECK ("maxStreamingProgramRooms" >= 0), CONSTRAINT "maxNonStreamingProgramRooms_GTE0" CHECK ("maxNonStreamingProgramRooms" >= 0), CONSTRAINT "maxPublicSocialRooms_GTE0" CHECK ("maxPublicSocialRooms" >= 0), CONSTRAINT "maxContentItems_GTE0" CHECK ("maxContentItems" >= 0), CONSTRAINT "maxMediaElementsPerContentItem_GTE0" CHECK ("maxMediaElementsPerContentItem" >= 0), CONSTRAINT "maxNonMediaElementsPerContentItem_GTE0" CHECK ("maxNonMediaElementsPerContentItem" >= 0), CONSTRAINT "maxMediaElementsPerSponsor_GTE0" CHECK ("maxMediaElementsPerSponsor" >= 0), CONSTRAINT "maxNonMediaElementsPerSponsor_GTE0" CHECK ("maxNonMediaElementsPerSponsor" >= 0));
CREATE OR REPLACE FUNCTION "conference"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_conference_Quota_updated_at"
BEFORE UPDATE ON "conference"."Quota"
FOR EACH ROW
EXECUTE PROCEDURE "conference"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_conference_Quota_updated_at" ON "conference"."Quota" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
