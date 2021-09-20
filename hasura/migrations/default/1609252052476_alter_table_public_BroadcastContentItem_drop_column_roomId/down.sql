ALTER TABLE "public"."BroadcastContentItem" ADD COLUMN "roomId" uuid;
ALTER TABLE "public"."BroadcastContentItem" ALTER COLUMN "roomId" DROP NOT NULL;
ALTER TABLE "public"."BroadcastContentItem" ADD CONSTRAINT BroadcastContentItem_roomId_fkey FOREIGN KEY (roomId) REFERENCES "public"."Room" (id) ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "public"."BroadcastContentItem" ADD CONSTRAINT BroadcastContentItem_roomId_key UNIQUE (roomId);
