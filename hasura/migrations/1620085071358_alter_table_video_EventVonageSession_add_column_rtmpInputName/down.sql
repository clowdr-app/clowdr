-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
alter table
    "video"."EventVonageSession" drop column if exists "rtmpInputName";