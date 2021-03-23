DROP INDEX IF EXISTS pin_chat_attendee_ids;
CREATE INDEX IF NOT EXISTS pin_chat_id ON "chat"."Pin" ("chatId");
CREATE INDEX IF NOT EXISTS pin_attendee_id ON "chat"."Pin" ("attendeeId");
