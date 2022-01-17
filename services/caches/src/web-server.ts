import { requestId } from "@midspace/server-utils/middlewares/request-id";
import cors from "cors";
import express from "express";
import path from "path";
import type { P } from "pino";
import pino from "pino";
import pinoHttp from "pino-http";
import { is } from "typescript-is";
import { router as cacheUpdateRouter } from "./http-routers/cacheUpdate";
import { awsClient } from "./lib/awsClient";
import { logger } from "./lib/logger";

async function main() {
    const CORS_ORIGIN = await awsClient.getAWSParameter(`${process.env.SERVICE_NAME}_CORS_ORIGIN`);
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3004;

    const server = express();

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

    server.use(
        cors({
            origin: CORS_ORIGIN.split(","),
        })
    );

    server.use("/cache/update", cacheUpdateRouter);

    const INDEX_FILE = "./resources/index.html";
    server.use((_req, res) => res.sendFile(path.resolve(path.join(__dirname, INDEX_FILE))));

    server.listen(PORT, function () {
        logger.info({ port: PORT }, `Listening on ${PORT}`);
        logger.info("Initialising AWS client");
        awsClient.initialize().then(() => {
            logger.info("Initialised AWS client");
        });
    });
}

main();
