CREATE MATERIALIZED VIEW "analytics"."mat_ItemTotalViews" AS 
 SELECT "ContentItemStats"."itemId",
    sum("ContentItemStats"."viewCount") AS "totalViewCount"
   FROM analytics."ContentItemStats"
  GROUP BY "ContentItemStats"."itemId";

CREATE OR REPLACE VIEW "analytics"."ItemTotalViews" AS 
 SELECT * FROM "analytics"."mat_ItemTotalViews";
