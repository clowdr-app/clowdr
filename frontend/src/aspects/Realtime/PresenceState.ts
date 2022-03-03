import { Mutex } from "async-mutex";
import type { Observer } from "../Observable";
import { Observable } from "../Observable";
import { realtimeService } from "./RealtimeService";

export class PresenceState {
    private offSocketAvailable: (() => void) | undefined;
    private offSocketUnavailable: (() => void) | undefined;
    private intervalId: number | undefined;
    setup(): void {
        this.offSocketAvailable?.();
        this.offSocketUnavailable?.();

        this.offSocketUnavailable =
            realtimeService.onSocketUnavailable("PresenceState.setup", (socket) => {
                socket.off("entered");
                socket.off("left");
                socket.off("presences");

                if (this.intervalId) {
                    const id = this.intervalId;
                    this.intervalId = undefined;
                    clearInterval(id);
                }
            }) ?? undefined;
        this.offSocketAvailable = realtimeService.onSocketAvailable("PresenceState.setup", (socket) => {
            socket.on("entered", this.onEntered.bind(this));
            socket.on("left", this.onLeft.bind(this));
            socket.on("presences", this.onListPresent.bind(this));

            realtimeService?.socket?.emit("pagePresence", this.currentPath);
            realtimeService.socket?.emit("conferencePresence", this.currentSlug);

            this.intervalId = setInterval(
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
        this.presences = {};
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
        // console.log("Presence:onListPresent", data);
        this.presences[data.listId] = new Set();
        for (const userId of data.userIds) {
            this.presences[data.listId].add(userId);
        }
        if (this.observers[data.listId]) {
            this.observers[data.listId].publish(this.presences[data.listId]);
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
}

export const State = new PresenceState();
