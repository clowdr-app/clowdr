CREATE OR REPLACE VIEW "schedule"."OverlappingEvents" AS
    SELECT rowA."conferenceId", rowA."id" AS "xId", rowB."id" AS "yId"
    FROM "schedule"."Event" AS rowA
    JOIN "schedule"."Event" AS rowB
    ON rowA."roomId" = rowB."roomId"
    AND rowA."id" != rowB."id"
    AND rowA."startTime" < rowB."endTime"
    AND rowA."endTime" > rowB."startTime";
