CREATE INDEX IF NOT EXISTS id_desc_chat_id ON "chat"."Message" ("chatId", "id" DESC);

CREATE INDEX IF NOT EXISTS chat_id ON "chat"."Reaction" ("messageId");

CREATE INDEX IF NOT EXISTS chat_id ON "chat"."Flag" ("messageId");
CREATE INDEX IF NOT EXISTS chat_id ON "chat"."Flag" ("flaggedById");

CREATE INDEX IF NOT EXISTS chat_attendee_ids ON "chat"."Typer" ("chatId","attendeeId") INCLUDE ("messageTypeName");
CREATE INDEX IF NOT EXISTS chat_attendee_ids ON "chat"."Pin" ("chatId","attendeeId") INCLUDE ("wasManuallyPinned");
CREATE INDEX IF NOT EXISTS chat_attendee_ids ON "chat"."Subscription" ("chatId","attendeeId") INCLUDE ("wasManuallySubscribed");
