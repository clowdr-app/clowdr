CREATE MATERIALIZED VIEW "analytics"."mat_ElementTotalViews" AS 
 SELECT "ContentElementStats"."elementId",
    sum("ContentElementStats"."viewCount") AS "totalViewCount"
   FROM analytics."ContentElementStats"
  GROUP BY "ContentElementStats"."elementId";
  
CREATE OR REPLACE VIEW "analytics"."ElementTotalViews" AS 
    SELECT * FROM "analytics"."mat_ElementTotalViews";
