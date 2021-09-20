CREATE VIEW "analytics"."ElementTotalViews" AS
SELECT "elementId", SUM("viewCount") as "totalViewCount"
FROM "analytics"."ContentElementStats"
GROUP BY "elementId";
