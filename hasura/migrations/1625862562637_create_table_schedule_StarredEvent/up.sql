CREATE TABLE "schedule"."StarredEvent" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "eventId" uuid NOT NULL, "registrantId" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("eventId") REFERENCES "schedule"."Event"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("registrantId") REFERENCES "registrant"."Registrant"("id") ON UPDATE cascade ON DELETE cascade);
CREATE OR REPLACE FUNCTION "schedule"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_schedule_StarredEvent_updated_at"
BEFORE UPDATE ON "schedule"."StarredEvent"
FOR EACH ROW
EXECUTE PROCEDURE "schedule"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_schedule_StarredEvent_updated_at" ON "schedule"."StarredEvent" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
