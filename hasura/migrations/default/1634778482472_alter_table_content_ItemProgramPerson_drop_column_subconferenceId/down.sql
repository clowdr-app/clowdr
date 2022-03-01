alter table "content"."ItemProgramPerson"
  add constraint "ItemProgramPerson_subconferenceId_fkey"
  foreign key (subconferenceId)
  references "conference"."Subconference"
  (id) on update cascade on delete cascade;
alter table "content"."ItemProgramPerson" alter column "subconferenceId" drop not null;
alter table "content"."ItemProgramPerson" add column "subconferenceId" uuid;
