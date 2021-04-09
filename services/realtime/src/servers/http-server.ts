import assert from "assert";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import path from "path";
import webPush from "web-push";
import { router as chatRouter } from "../http-routers/chat";
import { router as presenceRouter } from "../http-routers/presence";
import { router as testRouter } from "../http-routers/test";
import { router as vapidRouter } from "../http-routers/vapid";
import { sendNotification } from "../web-push/sendNotification";

assert(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3002;
const server = express();

// CHAT_TODO: Delete this test code
server.use(cors()); // Particularly this dodgy line ;)
const subscriptions: Record<string, webPush.PushSubscription> = {};
const pushInterval = 10;

setInterval(function () {
    Object.values(subscriptions).forEach(sendNotification);
}, pushInterval * 1000);

server.post("/push/register", bodyParser.json(), function (req, res) {
    const subscription = req.body.subscription as webPush.PushSubscription;
    if (!subscriptions[subscription.endpoint]) {
        console.log("Subscription registered " + subscription.endpoint);
        subscriptions[subscription.endpoint] = subscription;
    }
    res.sendStatus(201);
});

server.post("/push/unregister", bodyParser.json(), function (req, res) {
    const subscription = req.body.subscription as webPush.PushSubscription;
    if (subscriptions[subscription.endpoint]) {
        console.log("Subscription unregistered " + subscription.endpoint);
        delete subscriptions[subscription.endpoint];
    }
    res.sendStatus(201);
});

/////////////////////////////////////////

server.use(presenceRouter);
server.use("/test", testRouter);
server.use("/chat", chatRouter);
server.use("/vapid", vapidRouter);

const INDEX_FILE = "../resources/index.html";
server.use((_req, res) => res.sendFile(path.resolve(path.join(__dirname, INDEX_FILE))));

export const httpServer = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
