ALTER TABLE "job_queues"."InvitationEmailJob" ADD COLUMN "attendeeId" uuid;
ALTER TABLE "job_queues"."InvitationEmailJob" ALTER COLUMN "attendeeId" DROP NOT NULL;
ALTER TABLE "job_queues"."InvitationEmailJob" ADD CONSTRAINT InvitationEmailJob_attendeeId_key UNIQUE (attendeeId);
