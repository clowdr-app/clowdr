CREATE OR REPLACE FUNCTION chat.delete_pins_subs_for_room_person()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS
$$
DECLARE
    l_room record;
    l_chat record;
BEGIN
    SELECT "chatId", "roomPrivacyName" FROM "Room" WHERE "Room"."id" = OLD."roomId" INTO l_room;

    IF l_room."chatId" IS NOT NULL THEN
        IF NOT chat.attendee_has_access_to_chat(OLD."attendeeId", l_room."chatId") THEN
            DELETE FROM "chat"."Pin" 
                WHERE "chat"."Pin"."chatId" = l_room."chatId" 
                  AND "chat"."Pin"."attendeeId" = OLD."attendeeId";

            DELETE FROM "chat"."Subscription" 
                WHERE "chat"."Subscription"."chatId" = l_room."chatId" 
                  AND "chat"."Subscription"."attendeeId" = OLD."attendeeId";
        END IF;
    END IF;

    RETURN NEW;
END;
$$;
