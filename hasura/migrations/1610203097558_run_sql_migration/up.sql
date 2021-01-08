DO LANGUAGE PLPGSQL $$
DECLARE 
  ds record;
  nid uuid;
BEGIN
  FOR ds IN (SELECT "id", "conferenceId" FROM "Room" WHERE "chatId" IS NULL) LOOP
    INSERT INTO chat."Chat" ("conferenceId") VALUES (ds."conferenceId") RETURNING "id" INTO nid;
    UPDATE "Room" SET "chatId" = nid WHERE "id" = ds."id";
  END LOOP;

  FOR ds IN (SELECT "id","conferenceId" FROM "ContentGroup" WHERE "chatId" IS NULL) LOOP
    INSERT INTO chat."Chat" ("conferenceId") VALUES (ds."conferenceId") RETURNING "id" INTO nid;
    UPDATE "ContentGroup" SET "chatId" = nid WHERE "id" = ds."id";
  END LOOP;
END$$;

CREATE OR REPLACE FUNCTION chat.generate_chat()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
BEGIN
	INSERT INTO chat."Chat" ("conferenceId") VALUES (NEW."conferenceId") RETURNING "id" INTO nid;
    NEW."chatId" := nid;
	RETURN NEW;
END;
$$;

CREATE TRIGGER insert_chat BEFORE INSERT ON "Room" FOR EACH ROW EXECUTE PROCEDURE chat.generate_chat();
CREATE TRIGGER insert_chat BEFORE INSERT ON "ContentGroup" FOR EACH ROW EXECUTE PROCEDURE chat.generate_chat();
