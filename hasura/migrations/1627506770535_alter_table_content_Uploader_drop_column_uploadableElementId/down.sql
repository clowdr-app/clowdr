alter table "content"."Uploader" add constraint "Uploader_email_uploadableElementId_key" unique (uploadableElementId, email);
alter table "content"."Uploader"
  add constraint "Uploader_uploadableElementId_fkey"
  foreign key (uploadableElementId)
  references "content"."UploadableElement"
  (id) on update cascade on delete cascade;
alter table "content"."Uploader" alter column "uploadableElementId" drop not null;
alter table "content"."Uploader" add column "uploadableElementId" uuid;
