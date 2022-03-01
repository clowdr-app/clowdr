alter table "collection"."ProgramPerson"
  add constraint "ProgramPerson_originatingDataId_fkey"
  foreign key (originatingDataId)
  references "conference"."OriginatingData"
  (id) on update cascade on delete restrict;
alter table "collection"."ProgramPerson" alter column "originatingDataId" drop not null;
alter table "collection"."ProgramPerson" add column "originatingDataId" uuid;
