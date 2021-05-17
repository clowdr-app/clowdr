CREATE FUNCTION schedule.set_current_timestamp_timings_updated_at()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."timings_updated_at" = NOW();
  RETURN _new;
END;
$BODY$;

