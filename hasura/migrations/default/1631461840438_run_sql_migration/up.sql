CREATE OR REPLACE FUNCTION schedule."searchEvents"(search text, "conferenceId" uuid)
 RETURNS SETOF schedule."Event"
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    exhibitionIds uuid[];
    peopleIds uuid[];
    itemIds uuid[];
    arg_confId uuid := "conferenceId";
BEGIN
    SELECT INTO exhibitionIds ARRAY(SELECT "id" FROM "collection"."Exhibition" WHERE "collection"."Exhibition"."conferenceId" = arg_confId AND search <% "collection"."Exhibition"."name");
    SELECT INTO peopleIds ARRAY(SELECT "id" FROM "collection"."ProgramPerson" WHERE "collection"."ProgramPerson"."conferenceId" = arg_confId AND (search <% "collection"."ProgramPerson"."name" OR search <% "collection"."ProgramPerson"."affiliation"));
    SELECT INTO itemIds ARRAY(SELECT "id" FROM "content"."searchItems"(search, arg_confId));
    RETURN QUERY SELECT * FROM "schedule"."Event"
        WHERE
          "schedule"."Event"."conferenceId" = arg_confId
          AND (
            search <% ("name")
            OR (NOT ("schedule"."Event"."itemId" IS NULL) AND "schedule"."Event"."itemId" = ANY(itemIds))
            OR (NOT ("schedule"."Event"."exhibitionId" IS NULL) AND "schedule"."Event"."exhibitionId" = ANY(exhibitionIds))
          )
        ORDER BY
          similarity(search, ("name")) DESC;
END;
$function$;
