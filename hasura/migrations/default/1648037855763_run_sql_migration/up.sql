-- Exhibition

ALTER TABLE "collection"."Exhibition"
    DROP CONSTRAINT "Exhibition_name_conferenceId_fkey";

CREATE UNIQUE INDEX "collection_Exhibition_name_conferenceId"
    ON "collection"."Exhibition" ("name", "conferenceId")
    WHERE "subconferenceId" IS NULL;

CREATE UNIQUE INDEX "collection_Exhibition_name_subconferenceId"
    ON "collection"."Exhibition" ("name", "subconferenceId")
    WHERE "subconferenceId" IS NOT NULL;


-- Program Person

DROP INDEX "collection"."ProgramPerson_conferenceId_name_affiliation_key";
DROP INDEX "collection"."ProgramPerson_conferenceId_name_key";

CREATE UNIQUE INDEX "collection_ProgramPerson_conferenceId_name_affiliation"
	ON "collection"."ProgramPerson" ("conferenceId", "name", "affiliation")
	WHERE "affiliation" IS NOT NULL
	AND "subconferenceId" IS NULL;

CREATE UNIQUE INDEX "collection_ProgramPerson_conferenceId_name"
	ON "collection"."ProgramPerson" ("conferenceId", "name")
	WHERE "affiliation" IS NULL
	AND "subconferenceId" IS NULL;

CREATE UNIQUE INDEX "collection_ProgramPerson_subconferenceId_name_affiliation"
	ON "collection"."ProgramPerson" ("subconferenceId", "name", "affiliation")
	WHERE "affiliation" IS NOT NULL
	AND "subconferenceId" IS NOT NULL;

CREATE UNIQUE INDEX "collection_ProgramPerson_subconferenceId_name"
	ON "collection"."ProgramPerson" ("subconferenceId", "name")
	WHERE "affiliation" IS NULL
	AND "subconferenceId" IS NOT NULL;


-- Group

ALTER TABLE "registrant"."Group"
	DROP CONSTRAINT "Group_conferenceId_name_key";

CREATE UNIQUE INDEX "registrant_Group_conferenceId_name"
	ON "registrant"."Group" ("conferenceId", "name")
	WHERE "subconferenceId" IS NULL;

CREATE UNIQUE INDEX "registrant_Group_subconferenceId_name"
	ON "registrant"."Group" ("subconferenceId", "name")
	WHERE "subconferenceId" IS NOT NULL;
