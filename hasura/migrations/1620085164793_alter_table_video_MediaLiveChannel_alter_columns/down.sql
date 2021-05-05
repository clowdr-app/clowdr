-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
alter table "video"."MediaLiveChannel" rename column "rtmpAInputUri" to "rtmpInputUri";
alter table "video"."MediaLiveChannel" rename column "rtmpAInputId" to "rtmpInputId";
alter table "video"."MediaLiveChannel" rename column "rtmpAInputAttachmentName" to "vonageInputAttachmentName";
