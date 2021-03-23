DROP INDEX chat.subscription_chat_attendee_ids;
CREATE INDEX IF NOT EXISTS subscription_chat_id ON "chat"."Subscription" ("chatId");
CREATE INDEX IF NOT EXISTS subscription_attendee_id ON "chat"."Subscription" ("attendeeId");
