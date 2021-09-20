CREATE OR REPLACE FUNCTION public.trigger_insert_attendee_profile()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
BEGIN
    INSERT INTO "registrant"."Profile" ("registrantId") VALUES (NEW."id") ON CONFLICT ("registrantId") DO NOTHING;
	RETURN NEW;
END;
$BODY$;
