-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "video"."MediaLiveChannel" add column "rtmpBInputId" text null;
alter table "video"."MediaLiveChannel" add column "rtmpBInputUri" text null;
alter table "video"."MediaLiveChannel" add column "rtmpBInputAttachmentName" text null;
