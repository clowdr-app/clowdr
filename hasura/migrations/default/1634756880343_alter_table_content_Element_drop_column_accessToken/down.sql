alter table "content"."Element" alter column "accessToken" set default gen_random_uuid();
alter table "content"."Element" alter column "accessToken" drop not null;
alter table "content"."Element" add column "accessToken" text;
