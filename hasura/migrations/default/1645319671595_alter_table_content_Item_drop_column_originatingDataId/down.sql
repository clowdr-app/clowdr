alter table "content"."Item"
  add constraint "Item_originatingDataId_fkey"
  foreign key (originatingDataId)
  references "conference"."OriginatingData"
  (id) on update cascade on delete restrict;
alter table "content"."Item" alter column "originatingDataId" drop not null;
alter table "content"."Item" add column "originatingDataId" uuid;
