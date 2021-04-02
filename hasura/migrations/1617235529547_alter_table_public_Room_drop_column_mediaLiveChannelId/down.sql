alter table "public"."Room" alter column "mediaLiveChannelId" drop not null;
alter table "public"."Room" add column "mediaLiveChannelId" uuid;
