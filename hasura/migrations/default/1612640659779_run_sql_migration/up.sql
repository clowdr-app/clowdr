CREATE INDEX IF NOT EXISTS roomperson_attendee_id ON "public"."RoomPerson" ("attendeeId");
CREATE INDEX IF NOT EXISTS room_chat_id ON "public"."Room" ("chatId");
CREATE INDEX IF NOT EXISTS contentgroup_chat_id  ON "public"."ContentGroup" ("chatId");
