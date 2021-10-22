import type { Socket } from "socket.io";
import {
    onConnect as onConnectHandler,
    onEnterPage,
    onLeavePage,
    onObservePage,
    onUnobservePage,
} from "../socket-handlers/presence";

export function onConnect(socket: Socket, userId: string, conferenceSlugs: string[]): void {
    const socketId = socket.id;

    onConnectHandler(userId, socketId);

    socket.on("enterPage", onEnterPage(conferenceSlugs, userId, socketId));
    socket.on("leavePage", onLeavePage(conferenceSlugs, userId, socketId));
    socket.on("observePage", onObservePage(conferenceSlugs, socketId, socket));
    socket.on("unobservePage", onUnobservePage(conferenceSlugs, socketId, socket));
}
