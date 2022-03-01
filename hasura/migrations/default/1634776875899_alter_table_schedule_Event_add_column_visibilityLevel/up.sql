alter table "schedule"."Event" add column "visibilityLevel" text
 not null default 'INTERNAL';
