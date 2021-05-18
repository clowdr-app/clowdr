CREATE OR REPLACE PROCEDURE analytics.refresh_materialized_views()
LANGUAGE plpgsql
as
$$
BEGIN
 REFRESH MATERIALIZED VIEW analytics."mat_ElementTotalViews";
 REFRESH MATERIALIZED VIEW analytics."mat_ItemTotalViews";
 REFRESH MATERIALIZED VIEW analytics."mat_RoomPresence";
END;
$$;
