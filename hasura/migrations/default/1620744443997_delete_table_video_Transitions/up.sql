ALTER TABLE IF EXISTS "video"."Transitions" DROP CONSTRAINT IF EXISTS "Transitions_broadcastElementId_fkey";
ALTER TABLE IF EXISTS "video"."Transitions" DROP CONSTRAINT IF EXISTS "Transitions_conferenceId_fkey";
ALTER TABLE IF EXISTS "video"."Transitions" DROP CONSTRAINT IF EXISTS "Transitions_eventId_fkey";
ALTER TABLE IF EXISTS "video"."Transitions" DROP CONSTRAINT IF EXISTS "Transitions_fallbackBroadcastElementId_fkey";
ALTER TABLE IF EXISTS "video"."Transitions" DROP CONSTRAINT IF EXISTS "Transitions_roomId_fkey";
DROP TABLE IF EXISTS "video"."Transitions";
