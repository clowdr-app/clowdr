import assert from "assert";
import express from "express";
import path from "path";
import { router as presenceRouter } from "../http-routers/presence";
import { router as testRouter } from "../http-routers/test";

assert(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3002;
const server = express();

server.use(presenceRouter);
server.use(testRouter);

const INDEX_FILE = "../resources/index.html";
server.use((_req, res) => res.sendFile(path.resolve(path.join(__dirname, INDEX_FILE))));

export const httpServer = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
