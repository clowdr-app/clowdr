CREATE OR REPLACE VIEW "chat"."PinnedOrSubscribed"
AS SELECT COALESCE("chat"."Pin"."chatId","chat"."Subscription"."chatId") as "chatId", COALESCE("chat"."Pin"."attendeeId", "chat"."Subscription"."attendeeId") as "attendeeId"
FROM "chat"."Pin"
FULL OUTER JOIN "chat"."Subscription"
ON "chat"."Pin"."attendeeId" = "chat"."Subscription"."attendeeId"
AND "chat"."Pin"."chatId" = "chat"."Subscription"."chatId";
