alter table "video"."VideoRenderJob" alter column "broadcastElementId" drop not null;
alter table "video"."VideoRenderJob" add column "broadcastElementId" uuid;
