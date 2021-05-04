-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- alter table "video"."MediaLiveChannel" rename column "rtmpInputUri" to "rtmpAInputUri";
alter table "video"."MediaLiveChannel" rename column "rtmpInputId" to "rtmpAInputId";
alter table "video"."MediaLiveChannel" rename column "vonageInputAttachmentName" to "rtmpAInputAttachmentName";
