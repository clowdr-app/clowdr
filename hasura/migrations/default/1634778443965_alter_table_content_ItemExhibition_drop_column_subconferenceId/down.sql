alter table "content"."ItemExhibition"
  add constraint "ItemExhibition_subconferenceId_fkey"
  foreign key (subconferenceId)
  references "conference"."Subconference"
  (id) on update cascade on delete cascade;
alter table "content"."ItemExhibition" alter column "subconferenceId" drop not null;
alter table "content"."ItemExhibition" add column "subconferenceId" uuid;
