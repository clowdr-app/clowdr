CREATE UNIQUE INDEX "ProgramPerson_conferenceId_name_affiliation_key" ON "collection"."ProgramPerson" ("conferenceId", "name", "affiliation")
WHERE "affiliation" IS NOT NULL;

CREATE UNIQUE INDEX "ProgramPerson_conferenceId_name_key" ON "collection"."ProgramPerson" ("conferenceId", "name")
WHERE "affiliation" IS NULL;
