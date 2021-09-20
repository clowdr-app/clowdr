CREATE OR REPLACE VIEW "chat"."SubscriptionsWithUnnotifiedMessages"
AS SELECT "chat"."Subscription"."attendeeId", "chat"."Subscription"."chatId" FROM "chat"."Subscription"
WHERE NOT EXISTS (
    SELECT 1 FROM "chat"."ReadUpToIndex" 
    WHERE "chat"."Subscription"."chatId" = "chat"."ReadUpToIndex"."chatId"
    AND "chat"."ReadUpToIndex"."attendeeId" = "chat"."Subscription"."attendeeId"
	LIMIT 1
)
OR EXISTS (
    SELECT 1 FROM "chat"."Message"
    INNER JOIN "chat"."ReadUpToIndex"
    ON "chat"."ReadUpToIndex"."chatId" = "chat"."Subscription"."chatId"
    AND "chat"."ReadUpToIndex"."attendeeId" = "chat"."Subscription"."attendeeId"
    AND "chat"."Message"."chatId" = "chat"."Subscription"."chatId"
    AND "chat"."Message"."id" > "chat"."ReadUpToIndex"."notifiedUpToMessageId"
	LIMIT 1
);
