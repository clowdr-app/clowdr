ALTER TABLE "job_queues"."InvitationEmailJob" ADD COLUMN "attendeeIds" jsonb;
ALTER TABLE "job_queues"."InvitationEmailJob" ALTER COLUMN "attendeeIds" DROP NOT NULL;
