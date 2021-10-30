import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import { emitter } from "../socket-emitter/socket-emitter";
import { getReadUpToIndex } from "./cache/readUpToIndex";
import { generateChatRecentMessagesSetKey, notificationsRoomName } from "./chat";

export const maxUnreadMessages = 10;

export async function sendUnreadCount(chatId: string, userId: string): Promise<void> {
    const readUpToIndex = await getReadUpToIndex(chatId, userId, {
        chatId,
        userId,
        messageSId: undefined,
    });
    const redisSetKey = generateChatRecentMessagesSetKey(chatId);
    const redisClient = await redisClientPool.acquire("lib/unreadCount/sendUnreadCount");
    try {
        const rank = readUpToIndex?.messageSId
            ? await redisClientP.zrevrank(redisClient)(redisSetKey, readUpToIndex.messageSId)
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
