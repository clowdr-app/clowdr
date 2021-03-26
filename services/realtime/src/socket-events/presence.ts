import { Socket } from "socket.io";
import {
    onConnect as onConnectHandler,
    onEnterPage,
    onLeavePage,
    onObservePage,
    onUnobservePage,
} from "../socket-handlers/presence";

export function onConnect(socket: Socket, userId: string, conferenceSlug: string): void {
    const socketId = socket.id;

    onConnectHandler(userId, socketId);

    socket.on("enterPage", onEnterPage(conferenceSlug, userId, socketId));
    socket.on("leavePage", onLeavePage(conferenceSlug, userId, socketId));
    socket.on("observePage", onObservePage(conferenceSlug, socketId, socket));
    socket.on("unobservePage", onUnobservePage(conferenceSlug, socketId, socket));
}
