import jwksRsa, { SigningKey } from "jwks-rsa";
import socketIO, { Socket } from "socket.io";
import { createAdapter } from "socket.io-redis";
import { testJWKs } from "../jwks";
import { redisPubClient, redisSubClient } from "../redis";
import { onConnect as onConnectChat } from "../socket-events/chat";
import { onConnect as onConnectPresence } from "../socket-events/presence";
import { onDisconnect as onDisconnectPresence } from "../socket-handlers/presence";
import { authorize } from "./authorize";
import { httpServer } from "./http-server";

// Initialise the websocket server
export const socketServer = new socketIO.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
    transports: ["websocket"],
});

// Configure the websocket server's connection to redis
socketServer.adapter(
    createAdapter({ pubClient: redisPubClient, subClient: redisSubClient, key: process.env.REDIS_KEY })
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

// Handle incoming connections
socketServer.on("connection", function (socket: Socket) {
    const socketId = socket.id;

    // Validate the token
    if (!socket.decodedToken["https://hasura.io/jwt/claims"]) {
        console.error(`Socket ${socketId} attempted to connect with a JWT that was missing the relevant claims.`);
        socket.disconnect();
        return;
    }

    const userId: string = socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
    if (userId) {
        const conferenceSlugsRaw: string =
            socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-conference-slugs"] ?? "{}";
        const conferenceSlugs: string[] = JSON.parse(
            `[${conferenceSlugsRaw.substring(1, conferenceSlugsRaw.length - 1)}]`
        );

        console.log(`Authorized client connected: ${userId} / ${socketId}: ${conferenceSlugs}`);

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${userId} / ${socketId}: ${conferenceSlugs}`);

            onDisconnectPresence(socketId, userId);
        });

        onConnectPresence(socket, userId, conferenceSlugs);
        onConnectChat(socket, userId, conferenceSlugs);
    }
});
