alter table "content"."Element" add constraint "Element_requiredContentId_key" unique (uploadableId);
alter table "content"."Element" alter column "uploadableId" drop not null;
alter table "content"."Element" add column "uploadableId" uuid;
