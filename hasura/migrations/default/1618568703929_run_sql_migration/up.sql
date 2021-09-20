CREATE VIEW "AttendeeProfileBadges" AS
SELECT "attendeeId", value->>'name' as "name", value->>'colour' as "colour"
FROM "AttendeeProfile"
CROSS JOIN jsonb_array_elements("AttendeeProfile"."badges");
