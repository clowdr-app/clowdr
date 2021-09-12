CREATE OR REPLACE FUNCTION collection."searchProgramPerson"(search text, conferenceId uuid)
 RETURNS SETOF collection."ProgramPerson"
 LANGUAGE sql
 STABLE
AS $function$ 
SELECT   * 
FROM     "collection"."ProgramPerson" 
WHERE (  search <% ( "name" )
      OR search <% ( "affiliation" )
      )
      AND "conferenceId" = conferenceId
ORDER BY similarity(search, ( "name" )) DESC; 

$function$;
