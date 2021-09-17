CREATE FUNCTION "content"."itemProgramPerson_HasSubmissionRequestBeenSent"(itemPerson_row "content"."ItemProgramPerson")
RETURNS BOOLEAN AS $$
    SELECT 0 < (
        SELECT "submissionRequestsSentCount" FROM "collection"."ProgramPerson" AS person
        WHERE person.id = itemPerson_row."personId"
    )
$$ LANGUAGE sql STABLE;
