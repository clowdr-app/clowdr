CREATE OR REPLACE FUNCTION chat."unreadCount"(currRow chat."ReadUpToIndex")
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN (SELECT COUNT(*) FROM chat."Message" WHERE id > currRow."messageId");
END;
$function$;
