-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
-- UPDATE "public"."MediaLiveChannel"
SET "roomId" = r.id
FROM "public"."Room" r
WHERE
    "public"."MediaLiveChannel".id = r."mediaLiveChannelId";
