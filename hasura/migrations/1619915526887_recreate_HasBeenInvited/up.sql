CREATE OR REPLACE FUNCTION "registrant"."HasBeenInvited"(i_row "registrant"."Registrant")
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    invite_id uuid;
BEGIN
  SELECT id INTO invite_id FROM "registrant"."Invitation" WHERE "registrantId" = i_row.id;
  
  IF (invite_id IS NOT NULL) THEN
    RETURN EXISTS (SELECT 1 FROM "public"."Email" WHERE "invitationId" = invite_id and "reason" = 'invite');
  ELSE
    RETURN TRUE;
  END IF;
END;
$function$;
