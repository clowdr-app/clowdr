UPDATE "Invitation"
SET "conferenceId" = "Attendee"."conferenceId"
FROM "Attendee"
WHERE "Attendee"."id" = "Invitation"."attendeeId";
