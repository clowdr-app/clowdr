import assert from "assert";
import axios from "axios";
import { raw } from "body-parser";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";

assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

export const app: express.Application = express();

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
                console.log("Forwarding request");
                const headers = {
                    ...req.headers,
                    "X-Forwarded-For": req.ip,
                };
                delete headers.host;
                delete headers["content-length"];
                const response = await axios.post(ddforward, req.body, {
                    responseType: "text",
                    headers,
                });
                // origin: 'https://ed-frontend.dev.midspace.app',
                // referer: 'https://ed-frontend.dev.midspace.app/',
                res.status(response.status).send(response.data);
            } else {
                console.log("Not forwarding request", {
                    headers: req.headers,
                    body: req.body,
                    data: req.read(),
                    query: req.query,
                });
            }
        } catch (error: any) {
            console.error("Unable to forward data", {
                status: error.response?.status,
                statusText: error.response?.statusText,
                body: error.response?.body,
            });

            if (error.response) {
                res.status(error.response.status).json(error.response.body);
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
