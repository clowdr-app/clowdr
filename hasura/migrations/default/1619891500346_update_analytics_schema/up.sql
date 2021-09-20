ALTER TABLE "analytics"."ContentElementStats"
    RENAME CONSTRAINT "ContentElementStats_contentItemId_fkey" TO "ContentElementStats_elementId_fkey";

ALTER TABLE "analytics"."ContentItemStats"
    RENAME CONSTRAINT "ContentGroupStats_contentGroupId_fkey" TO "ContentItemStats_itemId_fkey";

CREATE INDEX "analytics_ContentElementStats_elementId" ON "analytics"."ContentElementStats" ("elementId");
CREATE INDEX "analytics_ContentItemStats_itemId" ON "analytics"."ContentItemStats" ("itemId");
CREATE INDEX "analytics_RoomStats_roomId" ON "analytics"."RoomStats" ("roomId");
