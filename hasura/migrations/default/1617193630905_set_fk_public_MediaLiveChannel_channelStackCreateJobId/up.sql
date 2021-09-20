alter table "public"."MediaLiveChannel"
  add constraint "MediaLiveChannel_channelStackCreateJobId_fkey"
  foreign key ("channelStackCreateJobId")
  references "job_queues"."ChannelStackCreateJob"
  ("id") on update cascade on delete set null;
