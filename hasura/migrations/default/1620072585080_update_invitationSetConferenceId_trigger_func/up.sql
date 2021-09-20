CREATE OR REPLACE FUNCTION public."invitationSetConferenceId"()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    VOLATILE
    COST 100
AS $BODY$
DECLARE 
    nid uuid;
BEGIN
    NEW."conferenceId" := (SELECT "conferenceId" FROM "registrant"."Registrant" WHERE "registrant"."Registrant"."id" = NEW."registrantId");
	RETURN NEW;
END;
$BODY$;
