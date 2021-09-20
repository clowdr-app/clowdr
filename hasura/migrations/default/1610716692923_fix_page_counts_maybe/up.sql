CREATE OR REPLACE FUNCTION presence.add_to_page_count()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    confId uuid;
    existingCount integer;
BEGIN
    SELECT COUNT(*) INTO existingCount FROM presence."OpenTab" WHERE "path" = NEW."path" AND "attendeeId" = NEW."attendeeId";

    IF existingCount = 1 THEN
        SELECT "conferenceId" INTO confId FROM "Attendee" WHERE "id" = NEW."attendeeId";
        INSERT INTO presence."Page" ("path", "count", "conferenceId") 
            VALUES (NEW."path", 1, confId) 
            ON CONFLICT ("path", "conferenceId") 
            DO UPDATE 
                SET "count" = presence."Page"."count" + 1;
    END IF;
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
    SELECT COUNT(*) INTO existingCount FROM presence."OpenTab" WHERE "path" = OLD."path" AND "attendeeId" = OLD."attendeeId";
    
    IF existingCount = 1 THEN
        SELECT "conferenceId" INTO confId FROM "Attendee" WHERE "id" = OLD."attendeeId";
        UPDATE presence."Page"
            SET "count" = presence."Page"."count" - 1
            WHERE "path" = OLD."path" 
              AND "conferenceId" = confId;
    END IF;
	RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS add_to_page_count on presence."OpenTab";
CREATE TRIGGER add_to_page_count AFTER INSERT ON presence."OpenTab" FOR EACH ROW EXECUTE PROCEDURE presence.add_to_page_count();

DROP TRIGGER IF EXISTS remove_from_page_count on presence."OpenTab";
CREATE TRIGGER remove_from_page_count BEFORE DELETE ON presence."OpenTab" FOR EACH ROW EXECUTE PROCEDURE presence.remove_from_page_count();
