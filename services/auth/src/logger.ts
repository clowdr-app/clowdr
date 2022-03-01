import type { P } from "pino";
import pino from "pino";
import { is } from "typescript-is";

export const logger = pino({
    level: is<P.Level>(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : "info",
});
