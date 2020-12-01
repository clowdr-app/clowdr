CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE "public"."Event"("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "roomId" uuid NOT NULL, "intendedRoomModeName" text NOT NULL, "contentGroupId" uuid, "originatingDataId" uuid, "name" text NOT NULL, "startTime" timestamptz NOT NULL, "durationSeconds" integer NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("intendedRoomModeName") REFERENCES "public"."RoomMode"("name") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("contentGroupId") REFERENCES "public"."ContentGroup"("id") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("originatingDataId") REFERENCES "public"."OriginatingData"("id") ON UPDATE cascade ON DELETE restrict);
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
CREATE TRIGGER "set_public_Event_updated_at"
BEFORE UPDATE ON "public"."Event"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_Event_updated_at" ON "public"."Event" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
