import assert from "assert";
import express from "express";
import path from "path";
import { router as chatRouter } from "../http-routers/chat";
import { router as presenceRouter } from "../http-routers/presence";
import { router as pushNotificationSubscriptionRouter } from "../http-routers/pushNotifications";
import { router as testRouter } from "../http-routers/test";
import { router as vapidRouter } from "../http-routers/vapid";

assert(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3002;
const server = express();

server.use(presenceRouter);
server.use("/test", testRouter);
server.use("/chat", chatRouter);
server.use("/vapid", vapidRouter);
server.use("/pushNotificationSubscription", pushNotificationSubscriptionRouter);

const INDEX_FILE = "../resources/index.html";
server.use((_req, res) => res.sendFile(path.resolve(path.join(__dirname, INDEX_FILE))));

export const httpServer = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
