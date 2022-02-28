-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "conference"."Conference" add column "logoURL" text
--  null;
alter table "conference"."Conference" drop column if exists "logoURL";
