CREATE INDEX "collection_ProgramPerson_name_gin" ON collection."ProgramPerson"
USING GIN ((name) gin_trgm_ops, (affiliation) gin_trgm_ops);
