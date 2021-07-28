INSERT INTO "content"."Element" (
    "id", 
    "created_at", 
    "updated_at", 
    "typeName", 
    "itemId", 
    "uploadableId", 
    "name", 
    "isHidden", 
    "originatingDataId", 
    "conferenceId", 
    "accessToken", 
    "uploadsRemaining",
    "data"
)
SELECT
    "id", 
    "created_at", 
    "updated_at", 
    "typeName", 
    "itemId", 
    "id" as "uploadableId",
    "name",
    "isHidden", 
    "originatingDataId", 
    "conferenceId", 
    "accessToken", 
    "uploadsRemaining",
    '[]' as "data"
FROM "content"."UploadableElement" AS uploadable
WHERE NOT EXISTS (
    SELECT 1 FROM "content"."Element" AS element 
    WHERE element."uploadableId" = uploadable.id
);


UPDATE "content"."Uploader"
SET
    "elementId" = element."id"
FROM "content"."Element" as element
WHERE element."uploadableId" = "uploadableElementId";
