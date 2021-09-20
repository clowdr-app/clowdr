alter table "video"."MediaLiveChannelStatus" alter column "state" set default 'UNKNOWN';
alter table "video"."MediaLiveChannelStatus" alter column "state" set not null;
