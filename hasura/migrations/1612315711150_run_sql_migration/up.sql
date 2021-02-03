CREATE OR REPLACE FUNCTION public.refresh_flat_user_permission()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
  AS
$$
DECLARE
    nid uuid;
BEGIN
    REFRESH MATERIALIZED VIEW "public"."mat_FlatUserPermission";
END;
$$;

DROP TRIGGER IF EXISTS refresh_flat_user_permission ON "Attendee";
CREATE TRIGGER refresh_flat_user_permission AFTER UPDATE OF "userId" ON "Attendee" EXECUTE PROCEDURE public.refresh_flat_user_permission();
