CREATE TABLE "room"."ShuffleRoom"("id" bigserial NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "shufflePeriodId" uuid NOT NULL, "roomId" uuid NOT NULL, "durationMinutes" integer NOT NULL, "startedAt" timestamptz NOT NULL, "reshuffleUponEnd" boolean NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("shufflePeriodId") REFERENCES "room"."ShufflePeriod"("id") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON UPDATE cascade ON DELETE restrict);
CREATE OR REPLACE FUNCTION "room"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_room_ShuffleRoom_updated_at"
BEFORE UPDATE ON "room"."ShuffleRoom"
FOR EACH ROW
EXECUTE PROCEDURE "room"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_room_ShuffleRoom_updated_at" ON "room"."ShuffleRoom" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
