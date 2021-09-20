CREATE OR REPLACE FUNCTION invitation_set_conference_id()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
BEGIN
    NEW."conferenceId" := (SELECT "conferenceId" FROM "Attendee" WHERE "Attendee"."id" = NEW."attendeeId");
	RETURN NEW;
END;
$$;

CREATE TRIGGER set_conference_id BEFORE INSERT ON "Invitation" FOR EACH ROW EXECUTE PROCEDURE invitation_set_conference_id();
