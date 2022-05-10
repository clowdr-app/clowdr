import type { Socket } from "socket.io";
import {
    onConferencePresence,
    onConnect as onConnectHandler,
    onObserveConference,
    onObservePage,
    onPagePresence,
    onPageUnpresence,
    onRoomParticipants,
    onUnobserveConference,
    onUnobservePage,
} from "../socket-handlers/presence";

export function onConnect(socket: Socket, userId: string): void {
    const socketId = socket.id;

    onConnectHandler(userId, socketId);

    socket.on("pagePresence", onPagePresence(userId, socketId));
    socket.on("pageUnpresence", onPageUnpresence(userId, socketId));
    socket.on("observePage", onObservePage(socketId, socket));
    socket.on("unobservePage", onUnobservePage(socketId, socket));

    socket.on("conferencePresence", onConferencePresence(userId, socketId));
    socket.on("observeConference", onObserveConference(socketId, socket));
    socket.on("unobserveConference", onUnobserveConference(socketId, socket));

    socket.on("roomParticipants", onRoomParticipants(userId, socket));
}
