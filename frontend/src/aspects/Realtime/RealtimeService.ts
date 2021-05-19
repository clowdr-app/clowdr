import { Mutex } from "async-mutex";
import * as R from "ramda";
import io from "socket.io-client";
import { Observable } from "../Observable";

export class RealtimeService {
    public socket: SocketIOClient.Socket | undefined;
    private mutex: Mutex = new Mutex();

    private _onSocketAvailable: Map<number, (socket: SocketIOClient.Socket) => void> = new Map();
    private _onSocketAvailableGen = 1;
    onSocketAvailable(handler: (socket: SocketIOClient.Socket) => void): () => void {
        const id = this._onSocketAvailableGen++;
        this._onSocketAvailable.set(id, handler);

        if (this.socket && this.socket.connected) {
            const sock = this.socket;
            setTimeout(() => handler(sock), 1);
        }

        return () => {
            this._onSocketAvailable.delete(id);
        };
    }

    private _onSocketUnavailable: Map<number, (socket: SocketIOClient.Socket) => void> = new Map();
    private _onSocketUnavailableGen = 1;
    onSocketUnavailable(handler: (socket: SocketIOClient.Socket) => void): () => void {
        const id = this._onSocketUnavailableGen++;
        this._onSocketUnavailable.set(id, handler);

        return () => {
            this._onSocketUnavailable.delete(id);
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

            this.socket.on("time", this.onTime.bind(this));

            // setTimeout(() => {
            //     this.RealTimeOffsetSync(true);
            // }, 1000);
            // this.realTimeSyncIntervalId = setInterval(
            //     (() => {
            //         this.RealTimeOffsetSync();
            //     }) as TimerHandler,
            //     5 * 60000
            // );
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
                if (this.realTimeSyncIntervalId !== undefined) {
                    clearInterval(this.realTimeSyncIntervalId);
                }

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

        if (this.socket) {
            for (const handler of this._onSocketUnavailable.values()) {
                handler(this.socket);
            }
        }
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

    private _realTimeOffsets: number[] = [];
    private get realTimeOffset(): number {
        return R.mean(this._realTimeOffsets);
    }
    public RealTimeOffset = new Observable<number>((observer) => {
        observer(this.realTimeOffset);
    });

    private realTimeSyncIntervalId: number | undefined;
    private realTimeSyncPacketIdGenerator = 1;
    public RealTimeOffsetSync(isInitial = false): void {
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                this.socket?.emit("time", {
                    id: this.realTimeSyncPacketIdGenerator++,
                    clientSendTime: Date.now(),
                    isInitial: isInitial && i === 5,
                });
            }, i * 1000);
        }
    }
    private onTime(syncPacket: {
        id: number;
        clientSendTime: number;
        serverSendTime: number;
        isInitial: boolean;
    }): void {
        const clientReceiveTime = Date.now();
        if (this._realTimeOffsets.length >= 10) {
            this._realTimeOffsets.splice(0, 1);
        }
        this._realTimeOffsets.push((clientReceiveTime - syncPacket.clientSendTime) / 2);

        const realTimeOffset = this.realTimeOffset;
        //         console.log("Offset values", this._realTimeOffsets);
        //         console.log(`Time sync:
        //     Client -> Server: ${syncPacket.serverSendTime - syncPacket.clientSendTime}ms
        //     Server -> Client: ${clientReceiveTime - syncPacket.serverSendTime}ms
        //     Overall: ${clientReceiveTime - syncPacket.clientSendTime}ms
        //     Offset: ${(clientReceiveTime - syncPacket.clientSendTime) / 2}ms
        //     Is initial: ${syncPacket.isInitial}
        //     ------
        //     Overall offset: ${realTimeOffset}
        // `);

        if (syncPacket.isInitial && realTimeOffset >= 10) {
            this.RealTimeOffsetSync();
        }
    }
}

export const realtimeService = new RealtimeService();
