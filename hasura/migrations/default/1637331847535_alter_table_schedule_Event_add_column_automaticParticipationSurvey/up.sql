alter table "schedule"."Event" add column "automaticParticipationSurvey" boolean
 not null default 'false';
