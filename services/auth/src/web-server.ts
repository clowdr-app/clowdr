import { requestId } from "@midspace/server-utils/middlewares/request-id";
import assert from "assert";
import cors from "cors";
import express from "express";
import path from "path";
import type { P } from "pino";
import { pino } from "pino";
import pinoHttp from "pino-http";
import { is } from "typescript-is";
import { router as hasuraRouter } from "./hasura";
import { logger } from "./logger";

assert(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3004;
const server = express();
server.use(
    cors({
        origin: process.env.CORS_ORIGIN.split(","),
    })
);

server.use(requestId());

server.use(
    pinoHttp({
        logger: logger as any, // 7.0-compatible @types not yet released for pino-http
        autoLogging: process.env.LOG_LEVEL === "trace" ? true : false,
        genReqId: (req) => req.id,
        serializers: {
            req: pino.stdSerializers.wrapRequestSerializer((r) => {
                const headers = { ...r.headers };
                delete headers["authorization"];
                delete headers["x-hasura-admin-secret"];
                delete headers["x-hasura-event-secret"];
                const s = {
                    ...r,
                    headers,
                };
                return s;
            }),
        },
        useLevel: is<P.Level>(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : "info",
    })
);

server.use("/hasura", hasuraRouter);

const INDEX_FILE = "./resources/index.html";
server.use((_req, res) => res.sendFile(path.resolve(path.join(__dirname, INDEX_FILE))));

export const httpServer = server.listen(PORT, () => logger.info({ port: PORT }, `Listening on ${PORT}`));
