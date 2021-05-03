CREATE OR REPLACE VIEW "content"."ElementByAccessToken" AS 
 SELECT "Element".id,
    "Element"."typeName",
    "Element".name,
    "Element".data,
    "Element"."layoutData",
    "UploadableElement"."accessToken",
    "Item".title AS "itemTitle"
   FROM content."Element"
     JOIN content."Item" ON ("Item".id = "Element"."itemId")
     JOIN content."UploadableElement" ON ("UploadableElement".id = "Element"."uploadableId");
