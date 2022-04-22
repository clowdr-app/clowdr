CREATE OR REPLACE FUNCTION registrant."isProgramPerson"(registrant_row registrant."Registrant")
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM "collection"."ProgramPerson" AS person
        WHERE person."registrantId" = registrant_row."id"
    )
$function$;
