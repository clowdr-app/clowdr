import type { Socket } from "socket.io";
import { onViewCount } from "../socket-handlers/analytics";
import { onConnect as onConnectHandler } from "../socket-handlers/presence";

export function onConnect(socket: Socket, userId: string, conferenceSlugs: string[]): void {
    const socketId = socket.id;

    onConnectHandler(userId, socketId);

    socket.on("analytics.view.count", onViewCount(conferenceSlugs, userId, socketId));
}
