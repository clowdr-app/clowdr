import { gql } from "@apollo/client/core";
import type { SigningKey } from "jwks-rsa";
import jwksRsa from "jwks-rsa";
import type { Socket } from "socket.io";
import socketIO from "socket.io";
import { createAdapter } from "socket.io-redis";
import { GetUserConferenceSlugsDocument } from "../generated/graphql";
import { testJWKs } from "../jwks";
import { notificationsRoomName } from "../lib/chat";
import { createRedisClient } from "../redis";
import { onConnect as onConnectAnalytics } from "../socket-events/analytics";
import { onConnect as onConnectChat, onDisconnect as onDisconnectChat } from "../socket-events/chat";
import { onConnect as onConnectHandRaise } from "../socket-events/handRaise";
import { onConnect as onConnectPresence } from "../socket-events/presence";
import { onDisconnect as onDisconnectAnalytics } from "../socket-handlers/analytics";
import { onDisconnect as onDisconnectHandRaise } from "../socket-handlers/handRaise";
import { onDisconnect as onDisconnectPresence } from "../socket-handlers/presence";
import { testMode } from "../testMode";
import { authorize } from "./authorize";
import { httpServer } from "./http-server";

// Initialise the websocket server
export const socketServer = new socketIO.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN?.split(","),
        methods: ["GET", "POST"],
    },
    transports: ["websocket"],
});

// We only need these if we're running a socket server, not just a worker process
// (Having them here reduces the total number of connections to the redis instance)
export const redisPubClient = createRedisClient();
export const redisSubClient = createRedisClient();

// Configure the websocket server's connection to redis
socketServer.adapter(
    createAdapter({
        pubClient: redisPubClient,
        subClient: redisSubClient,
        key: process.env.REDIS_KEY,
        requestsTimeout: 30000,
    })
);

// Setup JWT authorization
const jwksClient = jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 1,
    jwksUri: `https://${process.env.AUTH0_API_DOMAIN}/.well-known/jwks.json`,
    getKeysInterceptor: async () => {
        return testJWKs as SigningKey[];
    },
});
socketServer.use(
    authorize({
        secret: async (token) => {
            if (token && typeof token !== "string") {
                const key = await jwksClient.getSigningKey(token.header.kid);
                return key.getPublicKey();
            }
            return "";
        },
        algorithms: ["RS256"],
    })
);

gql`
    query GetUserConferenceIds($userId: String!) {
        conference_Conference(where: { registrants: { userId: { _eq: $userId } } }) {
            id
        }
    }
`;

// Handle incoming connections
socketServer.on("connection", async function (socket: Socket) {
    const socketId = socket.id;

    // Validate the token
    if (!socket.decodedToken["https://hasura.io/jwt/claims"]) {
        console.error(`Socket ${socketId} attempted to connect with a JWT that was missing the relevant claims.`);
        socket.disconnect();
        return;
    }

    const userId: string = socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
    if (userId) {
        console.log(`Authorized client connected: ${userId} / ${socketId}`);

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${userId} / ${socketId}`);

            onDisconnectPresence(socketId, userId);
            onDisconnectChat(socketId, userId);
            onDisconnectAnalytics(socketId, userId);
            onDisconnectHandRaise(socketId, userId);
        });

        const conferenceSlugs = await testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: GetUserConferenceSlugsDocument,
                    variables: { userId },
                });
                return response.data?.conference_Conference.map((x) => x.slug);
            },
            async () => ["test-conference-slug"]
        );

        onConnectPresence(socket, userId, conferenceSlugs);
        onConnectChat(socket, userId, conferenceSlugs);
        onConnectAnalytics(socket, userId, conferenceSlugs);
        onConnectHandRaise(socket, userId, conferenceSlugs);

        socket.on("time", (syncPacket: any) => {
            try {
                socket.emit("time", { ...syncPacket, serverSendTime: Date.now() });
                if (syncPacket?.clientSendTime && typeof syncPacket.clientSendTime === "number") {
                    console.log("Client time sync. Time offset=" + (Date.now() - syncPacket.clientSendTime) + "ms");
                }
            } catch {
                // Do nothing
            }
        });

        socket.join(notificationsRoomName(userId));
    }
});
