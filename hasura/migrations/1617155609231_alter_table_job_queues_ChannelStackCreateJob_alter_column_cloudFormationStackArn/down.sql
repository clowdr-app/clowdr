alter table "job_queues"."ChannelStackCreateJob" rename column "stackLogicalResourceId" to "cloudFormationStackArn";
alter table "job_queues"."ChannelStackCreateJob" alter column "cloudFormationStackArn" drop not null;
