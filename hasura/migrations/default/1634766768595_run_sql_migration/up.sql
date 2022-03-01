CREATE OR REPLACE VIEW "schedule"."OverlappingEvents" AS 
 SELECT rowa."conferenceId",
    rowa.id AS "xId",
    rowb.id AS "yId",
    rowa."subconferenceId"
   FROM (schedule."Event" rowa
     JOIN schedule."Event" rowb ON (((rowa."roomId" = rowb."roomId") AND (rowa.id <> rowb.id) AND (rowa."startTime" < rowb."endTime") AND (rowa."endTime" > rowb."startTime"))));
