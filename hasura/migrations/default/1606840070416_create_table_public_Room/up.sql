CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Room"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "conferenceId" uuid NOT NULL, "name" text NOT NULL, "currentMode" text NOT NULL, "originatingDataId" uuid, "capacity" integer, PRIMARY KEY ("id") , FOREIGN KEY ("conferenceId") REFERENCES "public"."Conference"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("currentMode") REFERENCES "public"."RoomMode"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("originatingDataId") REFERENCES "public"."OriginatingData"("id") ON UPDATE cascade ON DELETE restrict, UNIQUE ("id"), UNIQUE ("conferenceId", "name"));
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
CREATE TRIGGER "set_public_Room_updated_at"
BEFORE UPDATE ON "public"."Room"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Room_updated_at" ON "public"."Room" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
