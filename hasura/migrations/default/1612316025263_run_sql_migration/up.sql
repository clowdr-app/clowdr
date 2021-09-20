CREATE OR REPLACE FUNCTION public.refresh_flat_user_permission()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
BEGIN
    REFRESH MATERIALIZED VIEW "public"."mat_FlatUserPermission";
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_flat_user_permission ON "Attendee";
CREATE TRIGGER refresh_flat_user_permission AFTER UPDATE OF "userId" ON "Attendee" EXECUTE PROCEDURE public.refresh_flat_user_permission();
