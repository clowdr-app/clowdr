alter table "collection"."Tag"
  add constraint "Tag_originatingDataId_fkey"
  foreign key (originatingDataId)
  references "conference"."OriginatingData"
  (id) on update cascade on delete restrict;
alter table "collection"."Tag" alter column "originatingDataId" drop not null;
alter table "collection"."Tag" add column "originatingDataId" uuid;
