CREATE OR REPLACE VIEW "content"."ElementByAccessToken" AS 
 SELECT "Element".id,
    "Element"."typeName",
    "Element".name,
    "Element".data,
    "Element"."layoutData",
    "Element"."accessToken",
    "Item".title AS "itemTitle",
    "Element"."uploadsRemaining"
   FROM (content."Element"
     JOIN content."Item" ON (("Item".id = "Element"."itemId")));
