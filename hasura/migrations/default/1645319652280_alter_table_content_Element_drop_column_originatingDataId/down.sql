alter table "content"."Element"
  add constraint "Element_originatingDataId_fkey"
  foreign key (originatingDataId)
  references "conference"."OriginatingData"
  (id) on update cascade on delete restrict;
alter table "content"."Element" alter column "originatingDataId" drop not null;
alter table "content"."Element" add column "originatingDataId" uuid;
