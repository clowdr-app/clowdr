alter table "job_queues"."InvitationEmailJob" add constraint "InvitationEmailJob_attendeeId_key" unique ("attendeeId");
