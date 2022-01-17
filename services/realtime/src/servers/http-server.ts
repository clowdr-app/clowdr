import assert from "assert";
import cors from "cors";
import express from "express";
import path from "path";
import { router as analyticsRouter } from "../http-routers/analytics";
import { router as chatRouter } from "../http-routers/chat";
import { router as conferenceRouter } from "../http-routers/conference";
import { router as eventRouter } from "../http-routers/event";
import { router as presenceRouter } from "../http-routers/presence";
import { router as testRouter } from "../http-routers/test";
import { router as vapidRouter } from "../http-routers/vapid";
import { logger } from "../lib/logger";

async function main() {
    // TODO:
    assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

    const PORT = process.env.PORT || 3002;
    const server = express();
    server.use(
        cors({
            origin: process.env.CORS_ORIGIN.split(","),
        })
    );

    server.use(presenceRouter);
    server.use("/test", testRouter);
    server.use("/chat", chatRouter);
    server.use("/conference", conferenceRouter);
    server.use("/vapid", vapidRouter);
    server.use("/event", eventRouter);
    server.use("/analytics", analyticsRouter);

    const INDEX_FILE = "../resources/index.html";
    server.use((_req, res) => res.sendFile(path.resolve(path.join(__dirname, INDEX_FILE))));

    server.listen(PORT, () => logger.info({ port: PORT }, `Listening on ${PORT}`));
}

main();
