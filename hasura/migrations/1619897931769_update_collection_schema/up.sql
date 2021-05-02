ALTER TABLE "collection"."Exhibition"
    RENAME CONSTRAINT "Hallway_conferenceId_fkey" to "Exhibition_conferenceId_fkey";
ALTER TABLE "collection"."Exhibition"
    RENAME CONSTRAINT "Hallway_name_conferenceId_key" to "Exhibition_name_conferenceId_fkey";
ALTER TABLE "collection"."Exhibition"
    RENAME CONSTRAINT "Hallway_pkey" to "Exhibition_pkey";
CREATE INDEX "collection_Exhibition_conferenceId" ON "collection"."Exhibition" ("conferenceId");
ALTER TRIGGER "set_public_Hallway_updated_at" ON "collection"."Exhibition"
    RENAME TO "set_collection_Exhibition_updated_at";


ALTER TABLE "collection"."ProgramPerson"
    RENAME CONSTRAINT "ContentPerson_attendeeId_fkey" to "ProgramPerson_registrantId_fkey";
ALTER TABLE "collection"."ProgramPerson"
    RENAME CONSTRAINT "ContentPerson_conferenceId_fkey" to "ProgramPerson_conferenceId_fkey";
ALTER TABLE "collection"."ProgramPerson"
    RENAME CONSTRAINT "ContentPerson_conferenceId_name_affiliation_key" to "ProgramPerson_conferenceId_name_affiliation_key";
ALTER TABLE "collection"."ProgramPerson"
    RENAME CONSTRAINT "ContentPerson_originatingDataId_fkey" to "ProgramPerson_originatingDataId_fkey";
ALTER TABLE "collection"."ProgramPerson"
    RENAME CONSTRAINT "ContentPerson_pkey" to "ProgramPerson_pkey";
CREATE INDEX "collection_ProgramPerson_conferenceId" ON "collection"."ProgramPerson" ("conferenceId");
CREATE INDEX "collection_ProgramPerson_registrantId" ON "collection"."ProgramPerson" ("registrantId");
CREATE INDEX "collection_ProgramPerson_email" ON "collection"."ProgramPerson" ("email");

CREATE OR REPLACE FUNCTION "collection"."lowercaseProgramPersonEmailAddress"()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    NEW."email" := LOWER(NEW."email");
	RETURN NEW;
END;
$$;

CREATE TRIGGER "lowercaseEmail" BEFORE INSERT ON "collection"."ProgramPerson"
    FOR EACH ROW EXECUTE PROCEDURE "collection"."lowercaseProgramPersonEmailAddress"();

ALTER TRIGGER "set_public_Tag_updated_at" ON "collection"."Tag"
    RENAME TO "set_collection_Tag_updated_at";
