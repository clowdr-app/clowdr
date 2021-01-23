import { Mutex } from "async-mutex";

export class PresenceState {
    private socket: SocketIOClient.Socket | undefined;
    private mutex: Mutex = new Mutex();

    private static readonly PERIOD_MS = 30000;

    async begin(token: string): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.socket) {
                this.socket.close();
                this.socket = undefined;
            }

            const url = import.meta.env.SNOWPACK_PUBLIC_PRESENCE_SERVICE_URL;
            this.socket = io(url, {
                transportOptions: {
                    polling: { extraHeaders: { Authorization: `Bearer ${token}` } },
                },
            });

            this.socket.on("connect", this.onConnect.bind(this));
            this.socket.on("disconnect", this.onDisconnect.bind(this));
            this.socket.on("connect_error", this.onConnectError.bind(this));
            this.socket.on("unauthorized", this.onUnauthorized.bind(this));
            this.socket.on("present", this.onPresent.bind(this));
        } catch (e) {
            console.error("Failed to create socket for presence service.");
            this.socket = undefined;
        } finally {
            release();
        }
    }

    private intervalId: number | undefined;
    private onConnect() {
        console.log("Connected to presence service");

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(
            (() => {
                if (this.oldPath) {
                    this.socket?.emit("present", { utcMillis: Date.now(), path: this.oldPath });
                }

                for (const path in this.presences) {
                    const cutoff = Date.now() - 1.03 * PresenceState.PERIOD_MS;
                    if (!this.presences[path]) {
                        this.presences[path] = [];
                    }
                    this.presences[path] = this.presences[path].filter((x) => x >= cutoff);
                }
            }) as TimerHandler,
            PresenceState.PERIOD_MS
        );

        this.pageChanged(window.location.pathname);
    }

    private onDisconnect() {
        console.log("Disconnected from presence service");

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
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

    private presences: {
        [k: string]: number[];
    } = {};
    public getPresenceCount(path?: string): number {
        path = path ?? this.oldPath;
        if (!path) {
            return 0;
        }
        return (this.presences[path] ?? []).length;
    }
    public getAllPresenceCounts(): { [k: string]: number | undefined } {
        const result: { [k: string]: number | undefined } = {};

        for (const key in this.presences) {
            result[key] = this.presences[key].length;
        }

        return result;
    }

    private onPresent(data: { utcMillis: number; path: string }) {
        // console.log(`Presence received ${data.utcMillis} for ${data.path}`);
        const cutoff = Date.now() - 1.03 * PresenceState.PERIOD_MS;
        this.presences[data.path] = [...(this.presences[data.path] ?? []).filter((x) => x >= cutoff), data.utcMillis];
    }

    private oldPath: string | undefined;
    private oldPathObserverKey: number | undefined;
    private observerKeys: {
        [k: string]: number[];
    } = {};
    private observerKeyGenerator = 1;

    public pageChanged(newPath: string): void {
        const oldPath = this.oldPath;
        const oldPathKey = this.oldPathObserverKey;
        if (oldPath && oldPathKey) {
            this.observerKeys[oldPath] = this.observerKeys[oldPath].filter((x) => x !== oldPathKey);
            if (this.observerKeys[oldPath].length === 0) {
                this.socket?.emit("leavePage", oldPath);
            }
        }

        if (!this.observerKeys[newPath] || this.observerKeys[newPath].length === 0) {
            this.observerKeys[newPath] = [];
            this.socket?.emit("enterPage", newPath);
        }
        const newKey = this.observerKeyGenerator++;
        this.observerKeys[newPath].push(newKey);
        this.oldPathObserverKey = newKey;
        this.oldPath = newPath;
    }

    public observePage(path: string): number {
        if (!this.observerKeys[path] || this.observerKeys[path].length === 0) {
            this.observerKeys[path] = [];
            this.socket?.emit("observePage", path);
        }
        const newKey = this.observerKeyGenerator++;
        this.observerKeys[path].push(newKey);
        return newKey;
    }

    public unobservePage(key: number, path: string): void {
        if (this.observerKeys[path]) {
            this.observerKeys[path] = this.observerKeys[path].filter((x) => x !== key);
            if (this.observerKeys[path].length === 0) {
                this.socket?.emit("unobservePage", path);
            }
        }
    }
}

export const State = new PresenceState();
