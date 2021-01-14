CREATE OR REPLACE FUNCTION chat.generate_chat()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
BEGIN
    IF NEW."chatId" IS NULL THEN
	    INSERT INTO chat."Chat" ("conferenceId") VALUES (NEW."conferenceId") RETURNING "id" INTO nid;
        NEW."chatId" := nid;
    END IF;
	RETURN NEW;
END;
$$;
