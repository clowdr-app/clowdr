import { redisClientP } from "../redis";

export function generateChatRoomName(chatId: string): string {
    return `chat:chat.${chatId}`;
}

export function generateChatRecentMessagesSetKey(chatId: string): string {
    return `chat:chat.${chatId}.recentMessages`;
}

export function generateChatSubscriptionsChangedRoomName(attendeeId: string): string {
    return `chat:chat.subscriptions.${attendeeId}`;
}

export function generateChatPinsChangedRoomName(attendeeId: string): string {
    return `chat:chat.pins.${attendeeId}`;
}

export function notificationsRoomName(userId: string): string {
    return `chat:chat.${userId}`;
}

export function chatListenersKeyName(chatId: string): string {
    return `chat:chat.${chatId}.listeners`;
}

// Counter-part to `chatListenersKeyName`
export function socketChatsKeyName(socketId: string): string {
    return `chat:socket.${socketId}.chats`;
}
export function socketUserKeyName(socketId: string): string {
    return `chat:socket.${socketId}.user`;
}
export type SocketInfo = {
    socketId: string;
    userId: string;
};
export async function allSocketsAndUserIds(): Promise<SocketInfo[]> {
    const results: SocketInfo[] = [];
    let [cursor, keys] = await redisClientP.scan("0", "chat:socket.*.user");
    let partial = (
        await Promise.all(
            keys.map(async (key) => {
                const value = await redisClientP.get(key);
                if (value) {
                    return {
                        socketId: key.split(".")[1],
                        userId: value,
                    };
                }
                return undefined;
            })
        )
    ).filter((x) => !!x) as SocketInfo[];
    partial.forEach((pair) => {
        results.push(pair);
    });
    while (cursor !== "0") {
        [cursor, keys] = await redisClientP.scan(cursor, "chat:socket.*.user");
        partial = (
            await Promise.all(
                keys.map(async (key) => {
                    const value = await redisClientP.get(key);
                    if (value) {
                        return {
                            socketId: key.split(".")[1],
                            userId: value,
                        };
                    }
                    return undefined;
                })
            )
        ).filter((x) => !!x) as SocketInfo[];
        partial.forEach((pair) => {
            results.push(pair);
        });
    }

    return results;
}
