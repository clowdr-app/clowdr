alter table "chat"."Chat" alter column "remoteServiceId" drop not null;
alter table "chat"."Chat" add column "remoteServiceId" text;
