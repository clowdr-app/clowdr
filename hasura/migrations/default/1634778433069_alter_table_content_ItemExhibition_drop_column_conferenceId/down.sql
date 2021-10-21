alter table "content"."ItemExhibition"
  add constraint "ItemExhibition_conferenceId_fkey"
  foreign key (conferenceId)
  references "conference"."Conference"
  (id) on update cascade on delete cascade;
alter table "content"."ItemExhibition" alter column "conferenceId" drop not null;
alter table "content"."ItemExhibition" add column "conferenceId" uuid;
