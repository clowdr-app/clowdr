import assert from "assert";
import express from "express";
import { router as presenceRouter } from "../http-routers/presence";

assert(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3002;
const server = express();

server.use(presenceRouter);

const INDEX_FILE = "/resources/index.html";
server.use((_req, res) => res.sendFile(INDEX_FILE, { root: __dirname }));

export const httpServer = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
