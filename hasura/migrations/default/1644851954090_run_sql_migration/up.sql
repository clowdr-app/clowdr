CREATE UNIQUE INDEX "ImportJob_conferenceId_subconferenceId_status_key" ON "job_queues"."ImportJob" ("conferenceId", "subconferenceId")
WHERE "subconferenceId" IS NOT NULL AND "completed_at" IS NULL;

CREATE UNIQUE INDEX "ImportJob_conferenceId_status_key" ON "job_queues"."ImportJob" ("conferenceId")
WHERE "subconferenceId" IS NULL AND "completed_at" IS NULL;

ALTER TABLE "job_queues"."ImportJob"
ALTER COLUMN "status" SET NOT NULL;
