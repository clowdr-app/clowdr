CREATE OR REPLACE VIEW "content"."ElementByAccessToken" AS 
 SELECT "content"."Element"."id" as "id",
        "content"."Element"."typeName" as "typeName",
        "content"."Element"."name" as "name",
        "content"."Element"."data" as "data",
        "content"."Element"."layoutData" as "layoutData",
        "content"."Item"."title" as "itemTitle"
   FROM "content"."Element"
   INNER JOIN "content"."Item" ON "content"."Item"."id" = "content"."Element"."itemId"
   ORDER BY "itemTitle";
