alter table "content"."Element" add column "accessToken" text
 not null default gen_random_uuid();
