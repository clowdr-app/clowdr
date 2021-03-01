import { Mutex } from "async-mutex";
import io from "socket.io-client";
import { Observable, Observer } from "../Chat/ChatGlobalState";

export class PresenceState {
    private socket: SocketIOClient.Socket | undefined;
    private mutex: Mutex = new Mutex();

    async begin(token: string): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.socket) {
                this.socket.close();
                this.socket = undefined;
            }

            const url = import.meta.env.SNOWPACK_PUBLIC_PRESENCE_SERVICE_URL;
            this.socket = io(url, {
                transports: ["websocket"],
                auth: {
                    token,
                },
            } as any);

            this.socket.on("connect", this.onConnect.bind(this));
            this.socket.on("disconnect", this.onDisconnect.bind(this));
            this.socket.on("connect_error", this.onConnectError.bind(this));
            this.socket.on("unauthorized", this.onUnauthorized.bind(this));

            this.socket.on("entered", this.onEntered.bind(this));
            this.socket.on("left", this.onLeft.bind(this));
            this.socket.on("presences", this.onListPresent.bind(this));
        } catch (e) {
            console.error("Failed to create socket for presence service.");
            this.socket = undefined;
        } finally {
            release();
        }
    }

    end(): void {
        (async () => {
            const release = await this.mutex.acquire();
            try {
                this.presences = {};
                this.socket?.disconnect();
                this.socket = undefined;
            } catch (e) {
                console.error("Error ending presence state", e);
            } finally {
                release();
            }
        })();
    }

    private onConnect() {
        console.log("Connected to presence service");
        this.pageChanged(window.location.pathname);
    }

    private onDisconnect() {
        console.log("Disconnected from presence service");
    }

    private onConnectError(e: any) {
        // TODO
        console.error("Error connecting to presence service", e);
    }

    private onUnauthorized(error: any) {
        if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
            // TODO
            console.warn("User token has expired");
        } else {
            console.error("Error connecting to presence servie", error);
        }
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

    private oldPath: string | undefined;
    public pageChanged(newPath: string): void {
        // TODO: Similar mechanism for just the conference slug

        // console.log("Presence:pageChanged", newPath);
        this.socket?.emit("leavePage", this.oldPath);
        this.socket?.emit("enterPage", newPath);
        this.oldPath = newPath;
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
                    this.socket?.emit("observePage", path);
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
                            this.socket?.emit("unobservePage", path);
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
