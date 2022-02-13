alter table "collection"."ProgramPerson" add constraint "ProgramPerson_conferenceId_name_affiliation_key" unique ("conferenceId", "name", "affiliation");
