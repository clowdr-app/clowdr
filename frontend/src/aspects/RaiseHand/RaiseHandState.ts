import { Mutex } from "async-mutex";
import type { Schedule_EventProgramPersonRole_Enum } from "../../generated/graphql";
import { Observable, Observer } from "../Chat/ChatGlobalState";
import { realtimeService } from "../Realtime/RealtimeService";

export interface HandRaise_EventPerson {
    id: string;
    roleName: Schedule_EventProgramPersonRole_Enum;
    person: {
        id: string;
        name: string;
        affiliation?: string | null;
        registrantId?: string | null;
    };
}

export type RaisedHandUpdate =
    | { userIds: Set<string> }
    | { userId: string; wasAccepted: true; eventPerson: HandRaise_EventPerson }
    | { userId: string; wasAccepted: false };

export class RaiseHandState {
    private offSocketAvailable: (() => void) | undefined;
    private offSocketUnavailable: (() => void) | undefined;
    setup(): void {
        this.offSocketAvailable?.();
        this.offSocketUnavailable?.();

        this.offSocketAvailable = realtimeService.onSocketAvailable((socket) => {
            socket.on("event.handRaise.raised", this.onRaised.bind(this));
            socket.on("event.handRaise.lowered", this.onLowered.bind(this));
            socket.on("event.handRaise.listing", this.onListing.bind(this));
            socket.on("event.handRaise.accepted", this.onAccepted.bind(this));
            socket.on("event.handRaise.rejected", this.onRejected.bind(this));

            Object.keys(this.raisedHandsLists).forEach((eventId) => {
                this.fetch(eventId);
            });
        });
        this.offSocketUnavailable =
            realtimeService.onSocketUnavailable((socket) => {
                socket.off("event.handRaise.raised");
                socket.off("event.handRaise.lowered");
                socket.off("event.handRaise.listing");
                socket.off("event.handRaise.accepted");
                socket.off("event.handRaise.rejected");
            }) ?? undefined;
    }
    teardown(): void {
        this.offSocketAvailable?.();
        this.offSocketUnavailable?.();
        this.raisedHandsLists = {};
    }

    private observersMutex = new Mutex();
    private raisedHandsLists: {
        [k: string]: Set<string>;
    } = {};
    private raisedHandsObservers: {
        [k: string]: Observable<RaisedHandUpdate>;
    } = {};

    private onRaised(data: { eventId: string; userId: string }) {
        console.log("Event:handRaise:onRaised", data);
        if (!this.raisedHandsLists[data.eventId]) {
            this.raisedHandsLists[data.eventId] = new Set();
        }
        this.raisedHandsLists[data.eventId].add(data.userId);
        if (this.raisedHandsObservers[data.eventId]) {
            this.raisedHandsObservers[data.eventId].publish({
                userIds: this.raisedHandsLists[data.eventId],
            });
        }
    }
    private onLowered(data: { eventId: string; userId: string }) {
        console.log("Event:handRaise:onLowered", data);
        if (this.raisedHandsLists[data.eventId]) {
            this.raisedHandsLists[data.eventId].delete(data.userId);
            if (this.raisedHandsObservers[data.eventId]) {
                this.raisedHandsObservers[data.eventId].publish({
                    userIds: this.raisedHandsLists[data.eventId],
                });
            }
        }
    }
    private onListing(data: { eventId: string; userIds: string[] }) {
        console.log("Event:handRaise:onListing", data);
        this.raisedHandsLists[data.eventId] = new Set(data.userIds);
        if (this.raisedHandsObservers[data.eventId]) {
            this.raisedHandsObservers[data.eventId].publish({
                userIds: this.raisedHandsLists[data.eventId],
            });
        }
    }
    private onAccepted(data: { eventId: string; userId: string; eventPerson: HandRaise_EventPerson }) {
        console.log("Event:handRaise:onAccepted", data);
        if (this.raisedHandsObservers[data.eventId]) {
            this.raisedHandsObservers[data.eventId].publish({
                userId: data.userId,
                wasAccepted: true,
                eventPerson: data.eventPerson,
            });
        }
        if (this.raisedHandsLists[data.eventId]) {
            this.raisedHandsLists[data.eventId].delete(data.userId);
            if (this.raisedHandsObservers[data.eventId]) {
                this.raisedHandsObservers[data.eventId].publish({
                    userIds: this.raisedHandsLists[data.eventId],
                });
            }
        }
    }
    private onRejected(data: { eventId: string; userId: string }) {
        console.log("Event:handRaise:onRejected", data);
        if (this.raisedHandsObservers[data.eventId]) {
            this.raisedHandsObservers[data.eventId].publish({
                userId: data.userId,
                wasAccepted: false,
            });
        }
        if (this.raisedHandsLists[data.eventId]) {
            this.raisedHandsLists[data.eventId].delete(data.userId);
            if (this.raisedHandsObservers[data.eventId]) {
                this.raisedHandsObservers[data.eventId].publish({
                    userIds: this.raisedHandsLists[data.eventId],
                });
            }
        }
    }

    public raise(eventId: string): boolean {
        if (!realtimeService.socket) {
            return false;
        }
        realtimeService.socket.emit("event.handRaise.raise", eventId);
        return true;
    }
    public lower(eventId: string): boolean {
        if (!realtimeService.socket) {
            return false;
        }
        realtimeService.socket.emit("event.handRaise.lower", eventId);
        return true;
    }
    public fetch(eventId: string): boolean {
        if (!realtimeService.socket) {
            return false;
        }
        realtimeService.socket.emit("event.handRaise.fetch", eventId);
        return true;
    }
    public accept(eventId: string, userId: string): boolean {
        if (!realtimeService.socket) {
            return false;
        }
        realtimeService.socket.emit("event.handRaise.accept", eventId, userId);
        return true;
    }
    public reject(eventId: string, userId: string): boolean {
        if (!realtimeService.socket) {
            return false;
        }
        realtimeService.socket.emit("event.handRaise.reject", eventId, userId);
        return true;
    }
    public observe(eventId: string, observer: Observer<RaisedHandUpdate>): () => void {
        console.log("Event:handRaise:observeEvent", { eventId });

        const promise = (async () => {
            const release = await this.observersMutex.acquire();

            let unsubscribe: () => void = () => {
                // Empty
            };
            try {
                if (!this.raisedHandsObservers[eventId]) {
                    this.raisedHandsObservers[eventId] = new Observable((observer) => {
                        observer({ userIds: this.raisedHandsLists[eventId as string] ?? [] });
                    });
                }
                unsubscribe = this.raisedHandsObservers[eventId].subscribe(observer);

                if (this.raisedHandsObservers[eventId].observers.size === 1) {
                    realtimeService.socket?.emit("event.handRaise.observe", eventId);
                    realtimeService.socket?.emit("event.handRaise.fetch", eventId);
                }
            } catch (e) {
                console.error("Error subscribing to event observer", e);
            } finally {
                release();
            }
            return {
                unsubscribe,
                eventId,
            };
        })();

        return () => {
            (async () => {
                console.log("Event:handRaise:unobserveEvent", { eventId });

                const release = await this.observersMutex.acquire();

                try {
                    const info = await promise;
                    if (info.eventId) {
                        if (this.raisedHandsObservers[info.eventId].observers.size === 0) {
                            // realtimeService.socket?.emit("event.handRaise.unobserve", eventId);
                        }
                    }
                    info.unsubscribe();
                } catch (e) {
                    console.error("Error unsubscribing from event observer", e);
                } finally {
                    release();
                }
            })();
        };
    }

    private currentEventId: { eventId: string; userRole: Schedule_EventProgramPersonRole_Enum } | null = null;
    public CurrentEventId: Observable<{
        eventId: string;
        userRole: Schedule_EventProgramPersonRole_Enum;
    } | null> = new Observable((observer) => {
        observer(this.currentEventId);
    });
    /**
     * Automatically lowers hand for the previous event if it was known to be raised.
     * @param eventId
     * @param userId
     */
    public setCurrentEventId(
        eventId: string | null,
        userId: string,
        userRole: Schedule_EventProgramPersonRole_Enum
    ): void {
        if (this.currentEventId?.eventId !== eventId) {
            if (
                this.currentEventId !== null &&
                this.raisedHandsLists[this.currentEventId.eventId] &&
                this.raisedHandsLists[this.currentEventId.eventId].has(userId)
            ) {
                this.lower(this.currentEventId.eventId);
            }

            this.currentEventId =
                eventId !== null
                    ? {
                          eventId,
                          userRole,
                      }
                    : null;

            this.CurrentEventId.publish(this.currentEventId);
        }
    }

    private isBackstage = false;
    public IsBackstage: Observable<boolean> = new Observable((observer) => {
        observer(this.isBackstage);
    });
    public setIsBackstage(value: boolean): void {
        this.isBackstage = value;
        this.IsBackstage.publish(value);
    }

    private startTimeOfNextBackstage: number | null = null;
    public StartTimeOfNextBackstage: Observable<number | null> = new Observable((observer) => {
        observer(this.startTimeOfNextBackstage);
    });
    public setStartTimeOfNextBackstage(value: number | null): void {
        this.startTimeOfNextBackstage = value;
        this.StartTimeOfNextBackstage.publish(value);
    }
}

export const State = new RaiseHandState();
