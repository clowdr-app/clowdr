DROP TRIGGER IF EXISTS prevent_delete_pins ON chat."Pin";
DROP TRIGGER IF EXISTS prevent_delete_subscriptions ON chat."Subscription";

WITH
    invalid_pins AS (
        SELECT
            "chat"."Pin"."chatId" as chat_id, 
            "chat"."Pin"."attendeeId" as attendee_id
        FROM "chat"."Pin"
        INNER JOIN "chat"."Chat"
            ON "chat"."Pin"."chatId" = "chat"."Chat"."id"
        INNER JOIN "public"."Attendee"
            ON "chat"."Pin"."attendeeId" = "public"."Attendee"."id"
        WHERE "chat"."Chat"."conferenceId" != "public"."Attendee"."conferenceId"
    )
DELETE FROM "chat"."Pin"
    USING invalid_pins
    WHERE "chat"."Pin"."attendeeId" = invalid_pins.attendee_id 
        AND "chat"."Pin"."chatId" = invalid_pins.chat_id;

WITH
    invalid_subs AS (
        SELECT
            "chat"."Subscription"."chatId" as chat_id, 
            "chat"."Subscription"."attendeeId" as attendee_id
        FROM "chat"."Subscription"
        INNER JOIN "chat"."Chat"
            ON "chat"."Subscription"."chatId" = "chat"."Chat"."id"
        INNER JOIN "public"."Attendee"
            ON "chat"."Subscription"."attendeeId" = "public"."Attendee"."id"
        WHERE "chat"."Chat"."conferenceId" != "public"."Attendee"."conferenceId"
    )
DELETE FROM "chat"."Subscription"
    USING invalid_subs
    WHERE "chat"."Subscription"."attendeeId" = invalid_subs.attendee_id 
        AND "chat"."Subscription"."chatId" = invalid_subs.chat_id;


CREATE OR REPLACE FUNCTION chat.prevent_delete_mandatory_pin()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    IF (SELECT "enableMandatoryPin" FROM chat."Chat" WHERE "id" = OLD."chatId") THEN
        RETURN NULL;
    ELSE
        RETURN OLD;
    END IF;
END;
$$;


CREATE OR REPLACE FUNCTION chat.prevent_delete_mandatory_subscription()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    IF (SELECT "enableMandatorySubscribe" FROM chat."Chat" WHERE "id" = OLD."chatId") THEN
        RETURN NULL;
    ELSE
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER prevent_delete_pins BEFORE DELETE ON chat."Pin" FOR EACH ROW EXECUTE PROCEDURE chat.prevent_delete_mandatory_pin();
CREATE TRIGGER prevent_delete_subscriptions BEFORE DELETE ON chat."Subscription" FOR EACH ROW EXECUTE PROCEDURE chat.prevent_delete_mandatory_subscription();


CREATE OR REPLACE FUNCTION chat.update_pins()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    shouldBePinned boolean;
    attendeeIds record;
BEGIN
    shouldBePinned := NEW."enableAutoPin" OR NEW."enableMandatoryPin";
    
    IF shouldBePinned THEN
        FOR attendeeIds
        IN (SELECT "id" FROM "Attendee" 
            WHERE "Attendee"."conferenceId" = NEW."conferenceId" 
                AND NOT EXISTS (
                    SELECT "attendeeId" FROM chat."Pin" WHERE "chatId" = NEW."id" AND "attendeeId" = "id"
                )
        ) LOOP
            INSERT INTO chat."Pin" ("wasManuallyPinned","attendeeId","chatId") VALUES (false, attendeeIds."id", NEW."id");
        END LOOP;
    ELSE
        DELETE FROM chat."Pin" WHERE "chatId" = NEW."id" AND NOT "wasManuallyPinned";
    END IF;

    RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION chat.update_subscriptions()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    shouldBeSubscribed boolean;
    attendeeIds record;
BEGIN
    shouldBeSubscribed := NEW."enableAutoSubscribe" OR NEW."enableMandatorySubscribe";
    
    IF shouldBeSubscribed THEN
        FOR attendeeIds 
        IN (SELECT "id" FROM "Attendee" 
            WHERE "Attendee"."conferenceId" = NEW."conferenceId" 
                AND NOT EXISTS (
                    SELECT "attendeeId" FROM chat."Subscription" WHERE "chatId" = NEW."id" AND "attendeeId" = "id"
                )
        ) LOOP
            INSERT INTO chat."Subscription" ("wasManuallySubscribed","attendeeId","chatId") VALUES (false,attendeeIds."id", NEW."id");
        END LOOP;
    ELSE
        DELETE FROM chat."Subscription" WHERE "chatId" = NEW."id" AND NOT "wasManuallySubscribed";
    END IF;

    RETURN NEW;
END;
$$;
