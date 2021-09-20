ALTER TABLE ONLY "content"."UploadableElement" ALTER COLUMN "accessToken" SET DEFAULT gen_random_uuid();
