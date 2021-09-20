CREATE OR REPLACE FUNCTION "registrant"."invitationHash"(i_row "registrant"."Invitation")
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  SELECT encode(digest(i_row."inviteCode" || i_row."invitedEmailAddress", 'sha256'), 'hex')
$function$;
