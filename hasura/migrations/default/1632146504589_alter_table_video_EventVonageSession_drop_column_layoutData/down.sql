alter table "video"."EventVonageSession" alter column "layoutData" drop not null;
alter table "video"."EventVonageSession" add column "layoutData" jsonb;
