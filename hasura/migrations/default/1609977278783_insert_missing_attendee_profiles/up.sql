INSERT INTO "AttendeeProfile" ("attendeeId") (SELECT ("id") FROM "Attendee") ON CONFLICT ("attendeeId") DO NOTHING;
