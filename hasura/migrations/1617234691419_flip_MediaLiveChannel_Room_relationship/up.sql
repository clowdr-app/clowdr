UPDATE "public"."MediaLiveChannel"
SET "roomId" = r.id
FROM "public"."Room" r
WHERE
    "public"."MediaLiveChannel".id = r."mediaLiveChannelId";
