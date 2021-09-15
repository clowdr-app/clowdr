CREATE OR REPLACE FUNCTION content."countUploaders"(element "content"."Element")
 RETURNS bigint
 LANGUAGE sql
 STABLE
AS $function$
    SELECT COUNT(*)
    FROM "content"."Uploader"
    WHERE "elementId" = element.id
$function$;
