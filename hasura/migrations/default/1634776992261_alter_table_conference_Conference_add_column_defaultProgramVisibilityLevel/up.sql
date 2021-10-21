alter table "conference"."Conference" add column "defaultProgramVisibilityLevel" text
 not null default 'EXTERNAL';
