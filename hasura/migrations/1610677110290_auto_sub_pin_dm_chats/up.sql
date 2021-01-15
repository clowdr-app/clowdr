CREATE OR REPLACE FUNCTION chat.generate_chat()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
    isDM boolean;
BEGIN
    IF NEW."chatId" IS NULL THEN
        isDM := false;
        IF TG_ARGV[0] = 'true' THEN
            /* Room */
            isDM := (NEW."roomPrivacyName" = 'DM');
        END IF;

	    INSERT INTO chat."Chat" ("conferenceId","enableAutoSubscribe","enableAutoPin") VALUES (NEW."conferenceId", isDM, isDM) RETURNING "id" INTO nid;
        NEW."chatId" := nid;
    END IF;
	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS insert_chat on "Room";
DROP TRIGGER IF EXISTS insert_chat on "ContentGroup";
CREATE TRIGGER insert_chat BEFORE INSERT ON "Room" FOR EACH ROW EXECUTE PROCEDURE chat.generate_chat('true');
CREATE TRIGGER insert_chat BEFORE INSERT ON "ContentGroup" FOR EACH ROW EXECUTE PROCEDURE chat.generate_chat('false');
