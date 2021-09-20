alter table "collection"."ProgramPerson" add column "accessToken" text
 not null default gen_random_uuid();
