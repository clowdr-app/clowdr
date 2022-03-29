DROP FUNCTION IF EXISTS collection."searchProgramPerson"(search text, conferenceid uuid);

CREATE OR REPLACE FUNCTION collection."searchProgramPerson"(search text, conferenceid uuid, subconferenceid uuid)
 RETURNS SETOF collection."ProgramPerson"
 CALLED ON NULL INPUT
 LANGUAGE sql
 STABLE
AS $function$
SELECT   * 
FROM     "collection"."ProgramPerson" as person
WHERE search IS NOT NULL
    AND conferenceid IS NOT NULL
    AND (  search <% ( "name" )
          OR search <% ( "affiliation" )
        )
    AND person."conferenceId" = conferenceid
    AND CASE WHEN subconferenceid IS NULL THEN person."subconferenceId" IS NULL ELSE person."subconferenceId" = "subconferenceid" END
ORDER BY similarity(search, ( "name" )) DESC; 

$function$;
