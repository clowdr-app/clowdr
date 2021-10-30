import { readUpToIndicesCache } from "@midspace/caches/readUpToIndex";
import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import { emitter } from "../socket-emitter/socket-emitter";
import { generateChatRecentMessagesSetKey, notificationsRoomName } from "./chat";

export const maxUnreadMessages = 10;

export async function sendUnreadCount(chatId: string, userId: string): Promise<void> {
    const readUpToIndexMessageSId = await readUpToIndicesCache.getField(chatId, userId);
    const redisSetKey = generateChatRecentMessagesSetKey(chatId);
    const redisClient = await redisClientPool.acquire("lib/unreadCount/sendUnreadCount");
    try {
        const rank = readUpToIndexMessageSId
            ? await redisClientP.zrevrank(redisClient)(redisSetKey, readUpToIndexMessageSId)
            : await redisClientP.zcard(redisClient)(redisSetKey);

        const roomName = notificationsRoomName(userId);
        if (rank === null) {
            const unreadCount = await redisClientP.zcard(redisClient)(redisSetKey);
            emitter.to(roomName).emit("chat.unreadCount.update", chatId, formatUnreadCount(unreadCount));
        } else {
            emitter.to(roomName).emit("chat.unreadCount.update", chatId, formatUnreadCount(rank));
        }
    } finally {
        redisClientPool.release("lib/unreadCount/sendUnreadCount", redisClient);
    }
}

function formatUnreadCount(count: number): string {
    return count === 0 ? "" : count === maxUnreadMessages ? `${maxUnreadMessages}+` : count.toString();
}
