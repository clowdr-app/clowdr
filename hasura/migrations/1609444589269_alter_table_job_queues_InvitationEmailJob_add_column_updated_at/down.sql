DROP TRIGGER IF EXISTS "set_job_queues_InvitationEmailJob_updated_at" ON "job_queues"."InvitationEmailJob";
ALTER TABLE "job_queues"."InvitationEmailJob" DROP COLUMN "updated_at";
