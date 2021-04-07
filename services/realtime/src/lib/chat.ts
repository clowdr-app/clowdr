export function generateChatRoomName(chatId: string): string {
    return `chat:chat.${chatId}`;
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
