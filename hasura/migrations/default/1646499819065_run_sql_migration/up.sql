CREATE OR REPLACE FUNCTION conference."insertUsageAndQuota"()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO "conference"."Quota" ("conferenceId")
    SELECT NEW."id";

    INSERT INTO "conference"."Usage" ("conferenceId")
    SELECT NEW."id";

    RETURN NEW;
END
$function$;

CREATE TRIGGER "insertUsagesAndQuota"
AFTER INSERT ON "conference"."Conference"
FOR EACH ROW EXECUTE PROCEDURE "conference"."insertUsageAndQuota"();
