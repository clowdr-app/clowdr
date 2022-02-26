CREATE VIEW "schedule"."CurrentEvents" AS
SELECT * FROM "schedule"."Event" AS event
WHERE event."startTime" <= NOW() AND event."endTime" >= NOW();
