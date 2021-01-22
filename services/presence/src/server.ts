import { authorize } from "@thream/socketio-jwt";
import assert from "assert";
import crypto from "crypto";
import express from "express";
import jwksRsa from "jwks-rsa";
import socketIO, { Socket } from "socket.io";
import redis from "socket.io-redis";

assert(process.env.REDIS_URL, "REDIS_URL env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3002;

const jwksClient = jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 1,
    jwksUri: `https://${process.env.AUTH0_API_DOMAIN}/.well-known/jwks.json`,
});

const INDEX = "/resources/index.html";
const server = express()
    .use((_req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = new socketIO.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"],
    },
});
io.adapter(redis.createAdapter(process.env.REDIS_URL));

io.use(
    authorize({
        secret: async (token) => {
            if (token && typeof token !== "string") {
                const key = await jwksClient.getSigningKeyAsync(token.header.kid);
                return key.getPublicKey();
            }
            return "";
        },
        algorithms: ["RS256"],
    })
);

function getPageKey(confSlug: string, path: string) {
    const hash = crypto.createHash("sha256");
    hash.write(confSlug);
    hash.write(path);
    return hash.digest("hex");
}

io.on("connection", function (socket: Socket) {
    const userId = socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"];
    const conferenceSlug = socket.decodedToken["https://hasura.io/jwt/claims"]["x-hasura-conference-slug"];
    console.log(`Authorized client connected:
    User Id         : ${userId}
    Conference slug : ${conferenceSlug}
`);

    socket.on("disconnect", () => console.log("Client disconnected"));

    socket.on("enterPage", async (path: string) => {
        // console.log(`Entered page: ${path}`);

        const pageKey = getPageKey(conferenceSlug, path);
        await socket.join(pageKey);

        socket.to(pageKey).emit("present", {
            utcMillis: Date.now(),
            path,
        });
    });

    socket.on("leavePage", async (path: string) => {
        // console.log(`Left page: ${path}`);

        const pageKey = getPageKey(conferenceSlug, path);
        await socket.leave(pageKey);
    });

    socket.on("observePage", async (path: string) => {
        // console.log(`Observe page: ${path}`);

        const pageKey = getPageKey(conferenceSlug, path);
        await socket.join(pageKey);
    });

    socket.on("unobservePage", async (path: string) => {
        // console.log(`Unobserve page: ${path}`);

        const pageKey = getPageKey(conferenceSlug, path);
        await socket.leave(pageKey);
    });

    socket.on("present", (data: { utcMillis: number; path: string }) => {
        // console.log(`Present: ${userId} for ${data.path}`);

        const pageKey = getPageKey(conferenceSlug, data.path);
        socket.to(pageKey).emit("present", {
            utcMillis: data.utcMillis,
            path: data.path,
        });
    });
});
