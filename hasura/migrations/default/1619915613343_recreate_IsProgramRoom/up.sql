CREATE OR REPLACE FUNCTION "room"."IsProgramRoom"(i_row "room"."Room")
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
    SELECT EXISTS (SELECT 1 FROM "schedule"."Event" WHERE "schedule"."Event"."roomId" = i_row."id")
$function$;
