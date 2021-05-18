CREATE VIEW "analytics"."CompletedRegistrations" AS
SELECT conf.id, COUNT(registrant.id) FROM "conference"."Conference" as conf
JOIN "registrant"."Registrant" as registrant
ON registrant."conferenceId" = conf.id
AND registrant."userId" IS NOT NULL
GROUP BY conf.id;
