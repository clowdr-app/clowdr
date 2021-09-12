CREATE OR REPLACE FUNCTION schedule."searchEvents"(search text, "conferenceId" uuid)
 RETURNS SETOF schedule."Event"
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    exhibitionIds uuid[];
    peopleIds uuid[];
    itemIds uuid[];
BEGIN
    SELECT "id" INTO exhibitionIds FROM "collection"."Exhibition" WHERE "collection"."Exhibition"."conferenceId" = "conferenceId" AND search <% "collection"."Exhibition"."name";
    SELECT "id" INTO peopleIds FROM "collection"."ProgramPerson" WHERE "collection"."ProgramPerson"."conferenceId" = "conferenceId" AND (search <% "collection"."ProgramPerson"."name" OR search <% "collection"."ProgramPerson"."affiliation");
    SELECT "id" INTO itemIds FROM "content"."searchItems"(search, "conferenceId");
    RETURN QUERY SELECT * FROM "schedule"."Event"
        WHERE
          "schedule"."Event"."conferenceId" = "conferenceId"
          AND (
            search <% ("name")
            OR (NOT ("schedule"."Event"."itemId" IS NULL) AND "schedule"."Event"."itemId" = ANY(itemIds))
            OR (NOT ("schedule"."Event"."exhibitionId" IS NULL) AND "schedule"."Event"."exhibitionId" = ANY(exhibitionIds))
          )
        ORDER BY
          similarity(search, ("name")) DESC;
END;
$function$;
