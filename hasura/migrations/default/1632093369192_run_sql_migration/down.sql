-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- INSERT INTO "video"."VonageSessionLayout" ("vonageSessionId", "conferenceId", "layoutData")
-- SELECT
--     "sessionId" as "vonageSessionId",
--     "conferenceId",
--     "layoutData"
-- FROM "video"."EventVonageSession";