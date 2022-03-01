alter table "registrant"."Group" alter column "enabled" set default true;
alter table "registrant"."Group" alter column "enabled" drop not null;
alter table "registrant"."Group" add column "enabled" bool;
