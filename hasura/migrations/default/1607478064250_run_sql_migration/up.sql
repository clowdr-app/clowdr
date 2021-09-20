CREATE OR REPLACE FUNCTION public.invitationhash(invitation_row "Invitation")
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT encode(digest(invitation_row."inviteCode" || invitation_row."invitedEmailAddress", 'sha256'), 'hex')
$function$;
