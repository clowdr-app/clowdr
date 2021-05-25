import { invalidateSessions as invalidateChatSessions } from "../socket-events/chat";
import { invalidateSessions as invalidatePresenceSessions } from "../socket-handlers/presence";

async function invalidateAllSessions() {
    try {
        await invalidatePresenceSessions();
    } catch (e) {
        console.error("Error invalidating presence sessions", e);
    }

    try {
        await invalidateChatSessions();
    } catch (e) {
        console.error("Error invalidating chat sessions", e);
    }
}

invalidateAllSessions();
