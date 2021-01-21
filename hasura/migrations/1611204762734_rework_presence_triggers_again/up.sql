CREATE OR REPLACE FUNCTION presence.add_to_page_count()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    INSERT INTO "presence"."Page" ("path", "conferenceId", "count") 
    SELECT NEW."path", "Attendee"."conferenceId", 1
    FROM "Attendee"
    WHERE "Attendee"."id" = NEW."attendeeId"
        AND NOT EXISTS (SELECT 1 FROM "presence"."OpenTab" WHERE "path" = NEW."path" AND "attendeeId" = NEW."attendeeId")
    ON CONFLICT ("path", "conferenceId")
    DO UPDATE SET "count" = presence."Page"."count" + 1;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION presence.remove_from_page_count()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    confId uuid;
    existingCount integer;
BEGIN
    UPDATE presence."Page"
    SET "count" = GREATEST(presence."Page"."count" - 1, 0)
    WHERE "path" = OLD."path" 
      AND "conferenceId" = (SELECT "conferenceId" FROM "Attendee" WHERE "Attendee"."id" = OLD."attendeeId")
      AND NOT EXISTS (SELECT 1 FROM presence."OpenTab" WHERE "path" = OLD."path" AND "attendeeId" = OLD."attendeeId");
      
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS add_to_page_count on presence."OpenTab";
CREATE TRIGGER add_to_page_count BEFORE INSERT ON presence."OpenTab" FOR EACH ROW EXECUTE PROCEDURE presence.add_to_page_count();

DROP TRIGGER IF EXISTS remove_from_page_count on presence."OpenTab";
CREATE TRIGGER remove_from_page_count AFTER DELETE ON presence."OpenTab" FOR EACH ROW EXECUTE PROCEDURE presence.remove_from_page_count();
