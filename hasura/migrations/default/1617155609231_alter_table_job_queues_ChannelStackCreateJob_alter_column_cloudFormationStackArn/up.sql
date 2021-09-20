alter table "job_queues"."ChannelStackCreateJob" alter column "cloudFormationStackArn" set not null;
alter table "job_queues"."ChannelStackCreateJob" rename column "cloudFormationStackArn" to "stackLogicalResourceId";
