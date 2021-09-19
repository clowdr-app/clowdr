alter table "video"."MediaLiveChannelStatus" alter column "state" drop not null;
ALTER TABLE "video"."MediaLiveChannelStatus" ALTER COLUMN "state" drop default;
