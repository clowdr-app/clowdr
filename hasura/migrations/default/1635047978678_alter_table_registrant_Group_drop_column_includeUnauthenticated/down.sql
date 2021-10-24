alter table "registrant"."Group" alter column "includeUnauthenticated" set default false;
alter table "registrant"."Group" alter column "includeUnauthenticated" drop not null;
alter table "registrant"."Group" add column "includeUnauthenticated" bool;
