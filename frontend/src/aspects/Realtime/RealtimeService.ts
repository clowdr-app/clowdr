import { Mutex } from "async-mutex";
import io from "socket.io-client";

export class RealtimeService {
    public socket: SocketIOClient.Socket | undefined;
    private mutex: Mutex = new Mutex();

    private _onSocketAvailable: Map<number, (socket: SocketIOClient.Socket) => void> = new Map();
    private _onSocketAvailableGen = 1;
    onSocketAvailable(handler: (socket: SocketIOClient.Socket) => void): () => void {
        const id = this._onSocketAvailableGen++;
        this._onSocketAvailable.set(id, handler);

        if (this.socket) {
            const sock = this.socket;
            setTimeout(() => handler(sock), 1);
        }

        return () => {
            this._onSocketAvailable.delete(id);
        };
    }

    async begin(token: string): Promise<void> {
        const release = await this.mutex.acquire();
        try {
            if (this.socket) {
                this.socket.close();
                this.socket = undefined;
            }

            const url =
                import.meta.env.SNOWPACK_PUBLIC_REALTIME_SERVICE_URL ??
                import.meta.env.SNOWPACK_PUBLIC_PRESENCE_SERVICE_URL;
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
        } catch (e) {
            console.error("Failed to create socket for realtime service.");
            this.socket = undefined;
        } finally {
            release();
        }
    }

    end(): void {
        (async () => {
            const release = await this.mutex.acquire();
            try {
                this.socket?.disconnect();
                this.socket = undefined;
            } catch (e) {
                console.error("Error ending realtime state", e);
            } finally {
                release();
            }
        })();
    }

    private onConnect() {
        console.log("Connected to realtime service");

        if (this.socket) {
            for (const handler of this._onSocketAvailable.values()) {
                handler(this.socket);
            }
        }
    }

    private onDisconnect() {
        console.log("Disconnected from realtime service");
    }

    private onConnectError(e: any) {
        // TODO
        console.error("Error connecting to realtime service", e);
    }

    private onUnauthorized(error: any) {
        if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
            // TODO
            console.warn("User token has expired");
        } else {
            console.error("Error connecting to realtime servie", error);
        }
    }
}

export const realtimeService = new RealtimeService();
