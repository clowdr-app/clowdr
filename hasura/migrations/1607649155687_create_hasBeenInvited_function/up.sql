CREATE OR REPLACE FUNCTION public.hasBeenInvited(attendee_row "Attendee")
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    invite_id uuid;
BEGIN
  IF (EXISTS (SELECT id INTO invite_id FROM "Invitation" WHERE "attendeeId" = attendee_row.id)) THEN
    RETURN EXISTS (SELECT 1 FROM "Email" WHERE "invitationId" = invite_id and "reason" = 'invite');
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$;
