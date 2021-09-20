CREATE OR REPLACE FUNCTION trigger_insert_attendee_profile()
  RETURNS TRIGGER 
  LANGUAGE PLPGSQL
  AS
$$
BEGIN
    INSERT INTO "AttendeeProfile" ("attendeeId") VALUES (NEW."id") ON CONFLICT ("attendeeId") DO NOTHING;
	RETURN NEW;
END;
$$;
