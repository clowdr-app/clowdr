import { requestId } from "@midspace/server-utils/middlewares/request-id";
import assert from "assert";
import type { AxiosRequestHeaders } from "axios";
import axios from "axios";
import { raw } from "body-parser";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import type { P } from "pino";
import pino from "pino";
import pinoHttp from "pino-http";
import { is } from "typescript-is";
import { logger } from "./logger";

assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

export const app: express.Application = express();

app.use(requestId());

app.use(
    pinoHttp({
        logger: logger as any, // 7.0-compatible @types not yet released for pino-http
        autoLogging: process.env.LOG_LEVEL === "trace" ? true : false,
        genReqId: (req) => req.id,
        serializers: {
            req: pino.stdSerializers.wrapRequestSerializer((r) => {
                const headers = { ...r.headers };
                headers["authorization"] = Boolean(headers["authorization"]).toString();
                headers["x-hasura-admin-secret"] = Boolean(headers["x-hasura-admin-secret"]).toString();
                headers["x-hasura-event-secret"] = Boolean(headers["x-hasura-event-secret"]).toString();
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

app.use(
    cors({
        origin: process.env.CORS_ORIGIN.split(","),
    })
);

app.post(
    "/proxy",
    raw({
        type: "*/*",
        limit: "1MB",
    }),
    async (req: Request, res: Response) => {
        try {
            const ddforward = req.query.ddforward;
            if (ddforward && typeof ddforward === "string") {
                req.log.trace({ query: req.query }, "Forwarding request");
                const headers = {
                    ...req.headers,
                    "set-cookie": "",
                    "X-Forwarded-For": req.ip,
                };
                delete headers.host;
                delete headers["content-length"];
                const axiosHeaders: AxiosRequestHeaders = headers;
                delete axiosHeaders["set-cookie"];
                const response = await axios.post(ddforward, req.body, {
                    responseType: "text",
                    headers: axiosHeaders,
                });
                // origin: 'https://<local-host>',
                // referer: 'https://<local-host>/',
                res.status(response.status).send(response.data);
            } else {
                req.log.info(
                    {
                        headers: req.headers,
                        body: req.body,
                        data: req.read(),
                        query: req.query,
                    },
                    "Not forwarding request"
                );
            }
        } catch (err: unknown) {
            req.log.error({ err }, "Unable to forward data");

            if (axios.isAxiosError(err)) {
                res.status(err?.response?.status ?? 500).json(err?.response?.statusText);
            } else {
                res.status(500).json({});
            }
        }
    }
);

const portNumber = process.env.PORT ? parseInt(process.env.PORT, 10) : 3006;
export const server = app.listen(portNumber, function () {
    console.log(`App is listening on port ${portNumber}!`);
});
