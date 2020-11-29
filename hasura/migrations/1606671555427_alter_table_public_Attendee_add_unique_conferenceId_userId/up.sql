alter table "public"."Attendee" add constraint "Attendee_conferenceId_userId_key" unique ("conferenceId", "userId");
