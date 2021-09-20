DROP INDEX IF EXISTS id_desc_chat_id;
DROP INDEX IF EXISTS subscription_by_attendee_id;

DROP INDEX IF EXISTS read_up_to_index_by_chat_attendee;
DROP INDEX IF EXISTS read_up_to_index_by_chat;
DROP INDEX IF EXISTS read_up_to_index_by_attendee;
CREATE INDEX IF NOT EXISTS read_up_to_index_by_chat_attendee ON "chat"."ReadUpToIndex" ("chatId","attendeeId");
CREATE INDEX IF NOT EXISTS read_up_to_index_by_chat ON "chat"."ReadUpToIndex" ("chatId");
CREATE INDEX IF NOT EXISTS read_up_to_index_by_attendee ON "chat"."ReadUpToIndex" ("attendeeId");
