alter table "registrant"."GoogleAccount" add column "isDeleted" boolean
 not null default 'false';
