import { redisClientP } from "../redis";
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
    const rank = readUpToIndex?.messageSId ? await redisClientP.zrevrank(redisSetKey, readUpToIndex.messageSId) : null;

    const roomName = notificationsRoomName(userId);
    if (rank === null) {
        const unreadCount = await redisClientP.zcard(redisSetKey);
        emitter.to(roomName).emit("chat.unreadCount.update", chatId, formatUnreadCount(unreadCount));
    } else {
        emitter.to(roomName).emit("chat.unreadCount.update", chatId, formatUnreadCount(rank));
    }
}

function formatUnreadCount(count: number): string {
    return count === 0 ? "" : count === maxUnreadMessages ? `${maxUnreadMessages}+` : count.toString();
}
