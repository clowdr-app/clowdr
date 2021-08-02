alter table "conference"."Configuration" alter column "id" set default gen_random_uuid();
alter table "conference"."Configuration" alter column "id" drop not null;
alter table "conference"."Configuration" add column "id" uuid;
