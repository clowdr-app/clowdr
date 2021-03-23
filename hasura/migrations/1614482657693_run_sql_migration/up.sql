DROP INDEX "conference_id";
DROP INDEX "attendee_id";
DROP INDEX "role_id";
DROP INDEX "group_id";

DROP INDEX "group_conference_id";

CREATE INDEX "group_conference_id" ON "Group" ("conferenceId");
CREATE INDEX "group_enabled" ON "Group" ("enabled");
CREATE INDEX "group_include_unauthenticated" ON "Group" ("includeUnauthenticated");
