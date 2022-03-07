import type { Socket } from "socket.io";
import {
    onConnect as onConnectHandler,
    onEnterPage,
    onLeavePage,
    onObservePage,
    onRoomParticipants,
    onUnobservePage,
} from "../socket-handlers/presence";

export function onConnect(socket: Socket, userId: string): void {
    const socketId = socket.id;

    onConnectHandler(userId, socketId);

    socket.on("enterPage", onEnterPage(userId, socketId));
    socket.on("leavePage", onLeavePage(userId, socketId));
    socket.on("observePage", onObservePage(socketId, socket));
    socket.on("unobservePage", onUnobservePage(socketId, socket));

    socket.on("roomParticipants", onRoomParticipants(userId, socket));
}
