import type { NextFunction, Request, Response } from "express";
import { BadRequestError, ClientError, ForbiddenError, NotFoundError, ServerError } from "../lib/errors";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (err instanceof ClientError) {
        if (err instanceof BadRequestError) {
            req.log.error({ err }, err.options.privateMessage ?? "Bad request");
            res.status(400).send({ error: "Bad request", message: err.message });
        } else if (err instanceof ForbiddenError) {
            req.log.error({ err }, err.options.privateMessage ?? "Forbidden");
            res.status(403).send({ error: "Forbidden", message: err.message });
        } else if (err instanceof NotFoundError) {
            req.log.error({ err }, err.options.privateMessage ?? "Not found");
            res.status(404).send({ error: "Not found", message: err.message });
        } else {
            req.log.error({ err }, err.options.privateMessage ?? "Error");
            res.status(400).send({ error: "Error" });
        }
    } else if (err instanceof ServerError) {
        req.log.error({ err }, err.options.privateMessage ?? "Server error");
        res.status(500).send({ error: "Server error", message: err.message });
    } else {
        next(err);
    }
};
