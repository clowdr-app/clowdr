DROP TRIGGER IF EXISTS refresh_flat_user_permission_after_insert ON "Attendee";
CREATE TRIGGER refresh_flat_user_permission_after_insert AFTER INSERT ON "Attendee" EXECUTE PROCEDURE public.refresh_flat_user_permission();
