CREATE OR REPLACE FUNCTION public.hasBeenInvited(attendee_row "Attendee")
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    invite_id uuid;
BEGIN
  SELECT id INTO invite_id FROM "Invitation" WHERE "attendeeId" = attendee_row.id;
END;
$function$;
