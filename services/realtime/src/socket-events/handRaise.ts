import { Socket } from "socket.io";
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

export function onConnect(socket: Socket, userId: string, conferenceSlugs: string[]): void {
    const socketId = socket.id;

    onConnectHandler(userId, socketId);

    socket.on("event.handRaise.raise", onRaiseHand(conferenceSlugs, userId, socketId, socket));
    socket.on("event.handRaise.lower", onLowerHand(conferenceSlugs, userId, socketId, socket));
    socket.on("event.handRaise.fetch", onFetchHandsRaised(conferenceSlugs, userId, socketId, socket));
    socket.on("event.handRaise.accept", onAcceptHandRaised(conferenceSlugs, userId, socketId, socket));
    socket.on("event.handRaise.reject", onRejectHandRaised(conferenceSlugs, userId, socketId, socket));
    socket.on("event.handRaise.observe", onObserveEvent(conferenceSlugs, userId, socketId, socket));
    socket.on("event.handRaise.unobserve", onUnobserveEvent(conferenceSlugs, userId, socketId, socket));
}
