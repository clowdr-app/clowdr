alter table "public"."Email" drop column "idempotencyKey" cascade
alter table "public"."Email" drop column "idempotencyKey";
-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
