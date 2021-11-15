import { logger } from "../lib/logger";
import { invalidateSessions as invalidateChatSessions } from "../socket-events/chat";
import { invalidateSessions as invalidatePresenceSessions } from "../socket-handlers/presence";

async function invalidateAllSessions() {
    try {
        await invalidatePresenceSessions();
    } catch (error: any) {
        logger.error({ error }, "Error invalidating presence sessions");
    }

    try {
        await invalidateChatSessions();
    } catch (error: any) {
        logger.error({ error }, "Error invalidating chat sessions");
    }
}

invalidateAllSessions();
