CREATE TABLE "public"."AttendeeProfile"("attendeeId" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "photoS3ObjectName" text, "photoS3BucketName" text, "photoS3BucketRegion" text, "realName" text, "badges" jsonb, "affiliation" text, "country" text, "timezoneUTCOffset" Integer, "bio" text, "website" text, "github" text, "twitter" text, "affiliationURL" text, "pronouns" jsonb, PRIMARY KEY ("attendeeId") , FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("attendeeId"));
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_AttendeeProfile_updated_at"
BEFORE UPDATE ON "public"."AttendeeProfile"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_AttendeeProfile_updated_at" ON "public"."AttendeeProfile" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
