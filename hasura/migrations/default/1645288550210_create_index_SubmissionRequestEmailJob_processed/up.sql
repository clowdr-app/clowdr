CREATE  INDEX "SubmissionRequestEmailJob_processed" on
  "job_queues"."SubmissionRequestEmailJob" using btree ("processed");
