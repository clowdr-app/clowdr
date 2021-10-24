CREATE TABLE "room"."RoomGroupMembership" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), "roomId" uuid NOT NULL, "groupId" uuid NOT NULL, PRIMARY KEY ("id") , FOREIGN KEY ("roomId") REFERENCES "room"."Room"("id") ON UPDATE cascade ON DELETE cascade, FOREIGN KEY ("groupId") REFERENCES "registrant"."Group"("id") ON UPDATE cascade ON DELETE cascade, UNIQUE ("roomId", "groupId"));
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
CREATE TRIGGER "set_room_RoomGroupMembership_updated_at"
BEFORE UPDATE ON "room"."RoomGroupMembership"
FOR EACH ROW
EXECUTE PROCEDURE "room"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_room_RoomGroupMembership_updated_at" ON "room"."RoomGroupMembership" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
