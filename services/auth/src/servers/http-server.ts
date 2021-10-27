import assert from "assert";
import cors from "cors";
import express from "express";
import path from "path";
import { router as cacheUpdateRouter } from "../http-routers/cacheUpdate";
import { router as hasuraRouter } from "../http-routers/hasura";

assert(process.env.REDIS_KEY, "REDIS_KEY env var not defined.");
assert(process.env.AUTH0_API_DOMAIN, "AUTH0_API_DOMAIN env var not defined");
assert(process.env.CORS_ORIGIN, "CORS_ORIGIN env var not provided.");

const PORT = process.env.PORT || 3002;
const server = express();
server.use(
    cors({
        origin: process.env.CORS_ORIGIN.split(","),
    })
);

server.use("/hasura", hasuraRouter);
server.use("/cache/update", cacheUpdateRouter);

const INDEX_FILE = "../resources/index.html";
server.use((_req, res) => res.sendFile(path.resolve(path.join(__dirname, INDEX_FILE))));

export const httpServer = server.listen(PORT, () => console.log(`Listening on ${PORT}`));
