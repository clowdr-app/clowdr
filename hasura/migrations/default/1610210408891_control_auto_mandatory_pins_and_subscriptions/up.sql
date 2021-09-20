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
        FOR attendeeIds IN (SELECT "id" FROM "Attendee" WHERE NOT EXISTS (
                SELECT "attendeeId" FROM chat."Pin" WHERE "chatId" = NEW."id" AND "attendeeId" = "id"
            )) LOOP
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
        FOR attendeeIds IN (SELECT "id" FROM "Attendee" WHERE NOT EXISTS (
                SELECT "attendeeId" FROM chat."Subscription" WHERE "chatId" = NEW."id" AND "attendeeId" = "id"
            )) LOOP
            INSERT INTO chat."Subscription" ("wasManuallySubscribed","attendeeId","chatId") VALUES (false,attendeeIds."id", NEW."id");
        END LOOP;
    ELSE
        DELETE FROM chat."Subscription" WHERE "chatId" = NEW."id" AND NOT "wasManuallySubscribed";
    END IF;

    RETURN NEW;
END;
$$;


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

DROP TRIGGER IF EXISTS update_pins ON chat."Chat";
DROP TRIGGER IF EXISTS update_subscriptions ON chat."Chat";
DROP TRIGGER IF EXISTS prevent_delete_pins ON chat."Pin";
DROP TRIGGER IF EXISTS prevent_delete_subscriptions ON chat."Subscription";

CREATE TRIGGER update_pins AFTER UPDATE ON chat."Chat" FOR EACH ROW EXECUTE PROCEDURE chat.update_pins();
CREATE TRIGGER update_subscriptions AFTER UPDATE ON chat."Chat" FOR EACH ROW EXECUTE PROCEDURE chat.update_subscriptions();

CREATE TRIGGER prevent_delete_pins BEFORE DELETE ON chat."Pin" FOR EACH ROW EXECUTE PROCEDURE chat.prevent_delete_mandatory_pin();
CREATE TRIGGER prevent_delete_subscriptions BEFORE DELETE ON chat."Subscription" FOR EACH ROW EXECUTE PROCEDURE chat.prevent_delete_mandatory_subscription();
