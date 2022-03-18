-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- CREATE OR REPLACE FUNCTION content."checkUpdateItem"()
--  RETURNS trigger
--  LANGUAGE plpgsql
-- AS $function$
-- BEGIN
--     IF OLD."typeName" != NEW."typeName" AND NEW."typeName" != 'SPONSOR' THEN
--         IF (SELECT "remainingContentItems" FROM "conference"."RemainingQuota" as remQuota WHERE remQuota."conferenceId" = NEW."conferenceId") <= 0 THEN
--             RAISE EXCEPTION 'Quota limit reached (total public contents)';
--         END IF;
--     END IF;
--
--     RETURN NEW;
-- END
-- $function$;