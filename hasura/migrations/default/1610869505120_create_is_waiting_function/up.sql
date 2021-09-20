CREATE OR REPLACE FUNCTION "room".is_waiting(entry_row "room"."ShuffleQueueEntry")
    RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
    invite_id uuid;
BEGIN
  RETURN entry_row."allocatedShuffleRoomId" IS NULL;
END;
$function$;
