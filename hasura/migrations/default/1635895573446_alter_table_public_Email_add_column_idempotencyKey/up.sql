CREATE EXTENSION IF NOT EXISTS pgcrypto;
alter table "public"."Email" add column "idempotencyKey" uuid
 not null unique default gen_random_uuid();
