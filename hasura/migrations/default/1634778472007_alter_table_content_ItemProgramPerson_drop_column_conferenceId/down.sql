alter table "content"."ItemProgramPerson" add constraint "ItemProgramPerson_conferenceId_fkey" unique (conferenceId);
alter table "content"."ItemProgramPerson"
  add constraint "ItemProgramPerson_conferenceId_fkey"
  foreign key (conferenceId)
  references "conference"."Conference"
  (id) on update cascade on delete cascade;
alter table "content"."ItemProgramPerson" alter column "conferenceId" drop not null;
alter table "content"."ItemProgramPerson" add column "conferenceId" uuid;
