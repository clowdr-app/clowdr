INSERT INTO "video"."VonageSessionLayout" ("vonageSessionId", "conferenceId", "layoutData")
SELECT 
    "sessionId" as "vonageSessionId",
    "conferenceId",
    "layoutData"
FROM "video"."EventVonageSession";
