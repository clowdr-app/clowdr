alter table "room"."Room" add constraint "Room_originatingDataId_fkey" unique (originatingDataId);
alter table "room"."Room"
  add constraint "Room_originatingDataId_fkey"
  foreign key (originatingDataId)
  references "conference"."OriginatingData"
  (id) on update cascade on delete restrict;
alter table "room"."Room" alter column "originatingDataId" drop not null;
alter table "room"."Room" add column "originatingDataId" uuid;
