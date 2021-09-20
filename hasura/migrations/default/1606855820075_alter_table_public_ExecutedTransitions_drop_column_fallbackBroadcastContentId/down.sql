ALTER TABLE "public"."ExecutedTransitions" ADD COLUMN "fallbackBroadcastContentId" uuid;
ALTER TABLE "public"."ExecutedTransitions" ALTER COLUMN "fallbackBroadcastContentId" DROP NOT NULL;
ALTER TABLE "public"."ExecutedTransitions" ADD CONSTRAINT ExecutedTransitions_fallbackBroadcastContentId_fkey FOREIGN KEY (fallbackBroadcastContentId) REFERENCES "public"."BroadcastContentItem" (id) ON DELETE restrict ON UPDATE cascade;
