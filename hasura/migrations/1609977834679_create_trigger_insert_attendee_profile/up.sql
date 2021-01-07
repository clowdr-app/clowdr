CREATE TRIGGER trigger_insert_attendee AFTER INSERT ON "Attendee" FOR EACH ROW EXECUTE PROCEDURE trigger_insert_attendee_profile();
