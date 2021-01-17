CREATE TABLE "room"."ShuffleQueueEntry"("id" bigserial NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "shufflePeriodId" UUID NOT NULL, "attendeeId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("shufflePeriodId") REFERENCES "room"."ShufflePeriod"("id") ON UPDATE cascade ON DELETE restrict, FOREIGN KEY ("attendeeId") REFERENCES "public"."Attendee"("id") ON UPDATE cascade ON DELETE cascade);
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
CREATE TRIGGER "set_room_ShuffleQueueEntry_updated_at"
BEFORE UPDATE ON "room"."ShuffleQueueEntry"
FOR EACH ROW
EXECUTE PROCEDURE "room"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_room_ShuffleQueueEntry_updated_at" ON "room"."ShuffleQueueEntry" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
