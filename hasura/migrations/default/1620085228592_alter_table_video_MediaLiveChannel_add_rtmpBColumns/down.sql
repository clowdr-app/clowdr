-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
alter table "video"."MediaLiveChannel" drop column if exists "rtmpBInputId";
alter table "video"."MediaLiveChannel" drop column if exists "rtmpBInputUri";
alter table "video"."MediaLiveChannel" drop column if exists "rtmpBInputAttachmentName";
