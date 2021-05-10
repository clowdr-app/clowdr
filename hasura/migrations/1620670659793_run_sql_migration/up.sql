UPDATE "content"."UploadableElement"
SET "accessToken" = gen_random_uuid()
WHERE "accessToken" IS NULL;
