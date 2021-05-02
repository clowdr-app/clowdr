DROP FUNCTION IF EXISTS public.hasbeeninvited;

CREATE OR REPLACE FUNCTION "public"."Registrant_HasBeenInvited"(thisRow "Registrant")
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    invite_id uuid;
BEGIN
  SELECT id INTO invite_id FROM "Invitation" WHERE "registrantId" = thisRow.id;
  
  IF (invite_id IS NOT NULL) THEN
    RETURN EXISTS (SELECT 1 FROM "Email" WHERE "invitationId" = invite_id and "reason" = 'invite');
  ELSE
    RETURN TRUE;
  END IF;
END;
$function$;
