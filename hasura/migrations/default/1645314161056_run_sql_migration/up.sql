CREATE OR REPLACE FUNCTION registrant."searchRegistrants"(search text, conferenceid uuid) 
RETURNS SETOF registrant."Registrant"
LANGUAGE sql STABLE 
AS $function$
SELECT
  *
FROM
  "registrant"."Registrant" as reg
WHERE
  (
    search <% reg."displayName"
    OR EXISTS (SELECT 1 FROM "registrant"."Profile" as profile WHERE profile."registrantId" = reg.id AND search <% profile.affiliation)
    OR EXISTS (SELECT 1 FROM "registrant"."ProfileBadges" as profileBadges WHERE profileBadges."registrantId" = reg.id AND search <% profileBadges.name)
  )
  AND reg."conferenceId" = conferenceId
ORDER BY
  similarity(search, ("displayName")) DESC;
$function$;
