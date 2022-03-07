import { Mutex } from "async-mutex";
import type { Observer } from "../Observable";
import { Observable } from "../Observable";
import { realtimeService } from "./RealtimeService";

export class PresenceState {
    private offSocketAvailable: (() => void) | undefined;
    private offSocketUnavailable: (() => void) | undefined;
    private emitPresenceIntervalId: number | undefined;
    private roomParticipantsIntervalId: number | undefined;
    public conferenceId: string | undefined;
    setup(): void {
        this.offSocketAvailable?.();
        this.offSocketUnavailable?.();

        this.offSocketUnavailable =
            realtimeService.onSocketUnavailable("PresenceState.setup", (socket) => {
                if (this.roomParticipantsIntervalId) {
                    const id = this.roomParticipantsIntervalId;
                    this.roomParticipantsIntervalId = undefined;
                    clearInterval(id);
                }

                if (this.emitPresenceIntervalId) {
                    const id = this.emitPresenceIntervalId;
                    this.emitPresenceIntervalId = undefined;
                    clearInterval(id);
                }

                socket.off("entered");
                socket.off("left");
                socket.off("presences");
                socket.off("room-participants");
            }) ?? undefined;
        this.offSocketAvailable = realtimeService.onSocketAvailable("PresenceState.setup", (socket) => {
            socket.on("entered", this.onEntered.bind(this));
            socket.on("left", this.onLeft.bind(this));
            socket.on("presences", this.onListPresent.bind(this));
            socket.on("room-participants", this.onListRoomParticipants.bind(this));

            realtimeService?.socket?.emit("pagePresence", this.currentPath);
            realtimeService.socket?.emit("conferencePresence", this.currentSlug);

            this.roomParticipantsIntervalId = setInterval(
                (() => {
                    if (this.conferenceId) {
                        const confId = this.conferenceId;
                        Object.keys(this.roomObservers).map((roomId) => this.pollRoomParticipants(roomId, confId));
                    }
                }) as TimerHandler,
                60000
            );

            this.emitPresenceIntervalId = setInterval(
                (() => {
                    if (this.currentPath) {
                        realtimeService.socket?.emit("pagePresence", this.currentPath);
                    }
                    if (this.currentSlug) {
                        realtimeService.socket?.emit("conferencePresence", this.currentSlug);
                    }
                }) as TimerHandler,
                60000
            );
        });
    }

    teardown(): void {
        this.offSocketAvailable?.();
        this.offSocketUnavailable?.();
    }

    async sha256(message: string): Promise<string> {
        // encode as UTF-8
        const msgBuffer = new TextEncoder().encode(message);

        // hash the message
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        // convert bytes to hex string
        const hashHex = hashArray.map((b) => ("00" + b.toString(16)).slice(-2)).join("");
        return hashHex.toLowerCase();
    }

    private presences: {
        [k: string]: Set<string>;
    } = {};
    private observers: {
        [k: string]: Observable<Set<string>>;
    } = {};

    private roomParticipants: {
        [k: string]: Set<string>;
    } = {};
    private roomObservers: {
        [k: string]: Observable<Set<string>>;
    } = {};

    private onEntered(data: { listId: string; userId: string }) {
        // console.log("Presence:onEntered", data);
        if (!this.presences[data.listId]) {
            this.presences[data.listId] = new Set();
        }
        this.presences[data.listId].add(data.userId);
        if (this.observers[data.listId]) {
            this.observers[data.listId].publish(this.presences[data.listId]);
        }
    }
    private onLeft(data: { listId: string; userId: string }) {
        // console.log("Presence:onLeft", data);
        if (this.presences[data.listId]) {
            this.presences[data.listId].delete(data.userId);
            if (this.observers[data.listId]) {
                this.observers[data.listId].publish(this.presences[data.listId]);
            }
        }
    }
    private onListPresent(data: { listId: string; userIds: string[] }) {
        this.presences[data.listId] = new Set();
        for (const userId of data.userIds) {
            this.presences[data.listId].add(userId);
        }
        if (this.observers[data.listId]) {
            this.observers[data.listId].publish(this.presences[data.listId]);
        }
    }
    private onListRoomParticipants(data: { roomId: string; registrantIds: string[] }) {
        this.roomParticipants[data.roomId] = new Set();
        for (const registrantId of data.registrantIds) {
            this.roomParticipants[data.roomId].add(registrantId);
        }
        if (this.roomObservers[data.roomId]) {
            this.roomObservers[data.roomId].publish(this.roomParticipants[data.roomId]);
        }
    }

    private currentSlug: string | null = null;
    private currentPath: string | null = null;
    public pageChanged(newSlug: string | null, newPath: string): void {
        if (this.currentPath !== newPath) {
            realtimeService?.socket?.emit("pageUnpresence", this.currentPath);
        }

        this.currentSlug = newSlug;
        this.currentPath = newPath;

        realtimeService?.socket?.emit("pagePresence", this.currentPath);
    }

    private observersMutex = new Mutex();
    public observePage(
        path: string,
        conferenceSlug: string | undefined | null,
        observer: Observer<Set<string>>
    ): () => void {
        // console.log("Presence:observePage", path, conferenceSlug);

        const promise = (async () => {
            const release = await this.observersMutex.acquire();

            const confSlug = conferenceSlug ?? "<<NO-CONFERENCE>>";
            let unsubscribe: () => void = () => {
                // Empty
            };
            let listId: string | undefined;
            try {
                listId = await this.sha256(confSlug + path);
                if (!this.observers[listId]) {
                    this.observers[listId] = new Observable((observer) => {
                        observer(this.presences[listId as string] ?? new Set());
                    });
                }
                unsubscribe = this.observers[listId].subscribe(observer);

                if (this.observers[listId].observers.size === 1) {
                    realtimeService.socket?.emit("observePage", path);
                }
            } catch (e) {
                console.error("Error subscribing to presence observer", e);
            } finally {
                release();
            }
            return {
                unsubscribe,
                listId,
            };
        })();

        return () => {
            (async () => {
                // console.log("Presence:unobservePage", path, conferenceSlug);

                const release = await this.observersMutex.acquire();

                try {
                    const info = await promise;
                    if (info.listId) {
                        if (this.observers[info.listId].observers.size === 0) {
                            realtimeService.socket?.emit("unobservePage", path);
                        }
                    }
                    info.unsubscribe();
                } catch (e) {
                    console.error("Error unsubscribing from presence observer", e);
                } finally {
                    release();
                }
            })();
        };
    }

    private roomObserversMutex = new Mutex();
    public pollRoomParticipants(roomId: string, conferenceId: string) {
        realtimeService.socket?.emit("roomParticipants", { roomId, conferenceId });
    }
    public observeRoom(roomId: string, conferenceId: string, observer: Observer<Set<string>>): () => void {
        const promise = (async () => {
            const release = await this.roomObserversMutex.acquire();

            let unsubscribe: () => void = () => {
                // Empty
            };
            try {
                if (!this.roomObservers[roomId]) {
                    this.roomObservers[roomId] = new Observable((observer) => {
                        observer(this.presences[roomId as string] ?? new Set());
                    });
                }
                unsubscribe = this.roomObservers[roomId].subscribe(observer);

                this.pollRoomParticipants(roomId, conferenceId);
            } catch (e) {
                console.error("Error subscribing to presence observer", e);
            } finally {
                release();
            }
            return {
                unsubscribe,
                roomId,
                conferenceId,
            };
        })();

        return () => {
            (async () => {
                const release = await this.roomObserversMutex.acquire();

                try {
                    const info = await promise;
                    info.unsubscribe();
                } catch (e) {
                    console.error("Error unsubscribing from presence observer", e);
                } finally {
                    release();
                }
            })();
        };
    }
}

export const State = new PresenceState();
