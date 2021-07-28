alter table "content"."Uploader" add constraint "Uploader_elementId_email_key" unique ("elementId", "email");
