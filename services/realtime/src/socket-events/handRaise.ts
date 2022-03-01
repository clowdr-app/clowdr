import type { Socket } from "socket.io";
import {
    onAcceptHandRaised,
    onConnect as onConnectHandler,
    onFetchHandsRaised,
    onLowerHand,
    onObserveEvent,
    onRaiseHand,
    onRejectHandRaised,
    onUnobserveEvent,
} from "../socket-handlers/handRaise";

export function onConnect(socket: Socket, userId: string): void {
    const socketId = socket.id;

    onConnectHandler(userId, socketId);

    socket.on("event.handRaise.raise", onRaiseHand(userId, socketId, socket));
    socket.on("event.handRaise.lower", onLowerHand(userId, socketId, socket));
    socket.on("event.handRaise.fetch", onFetchHandsRaised(userId, socketId, socket));
    socket.on("event.handRaise.accept", onAcceptHandRaised(userId, socketId, socket));
    socket.on("event.handRaise.reject", onRejectHandRaised(userId, socketId, socket));
    socket.on("event.handRaise.observe", onObserveEvent(userId, socketId, socket));
    socket.on("event.handRaise.unobserve", onUnobserveEvent(userId, socketId, socket));
}
