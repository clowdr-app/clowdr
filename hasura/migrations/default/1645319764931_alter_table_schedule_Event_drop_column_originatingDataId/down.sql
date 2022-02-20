alter table "schedule"."Event"
  add constraint "Event_originatingDataId_fkey"
  foreign key (originatingDataId)
  references "conference"."OriginatingData"
  (id) on update cascade on delete restrict;
alter table "schedule"."Event" alter column "originatingDataId" drop not null;
alter table "schedule"."Event" add column "originatingDataId" uuid;
