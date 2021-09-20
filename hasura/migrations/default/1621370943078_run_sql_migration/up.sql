CREATE VIEW "analytics"."ItemTotalViews" AS
SELECT "itemId", SUM("viewCount") as "totalViewCount"
FROM "analytics"."ContentItemStats"
GROUP BY "itemId";
