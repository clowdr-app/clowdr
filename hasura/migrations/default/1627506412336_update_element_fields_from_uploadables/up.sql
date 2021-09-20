UPDATE "content"."Element" as el
SET
    "uploadsRemaining" = up."uploadsRemaining",
    "isHidden" = up."isHidden",
    "accessToken" = up."accessToken"
FROM "content"."UploadableElement" as up
WHERE up."id" = el."uploadableId";
