INSERT INTO "content"."ElementPermissionGrant" (
    "id", 
    "created_at", 
    "updated_at", 
    "permissionSetId", 
    "conferenceSlug", 
    "groupId", 
    "entityId"
)
SELECT
    "id", 
    "created_at", 
    "updated_at", 
    "permissionSetId", 
    "conferenceSlug", 
    "groupId", 
    "entityId"
FROM "content"."UploadableElementPermissionGrant" AS up
WHERE up."entityId" = (
    SELECT "id" FROM "content"."Element" AS element 
    WHERE element."uploadableId" = up."entityId"
);
