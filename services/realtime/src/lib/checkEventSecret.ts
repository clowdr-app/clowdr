import assert from "assert";
import type { NextFunction, Request, Response } from "express";

assert(process.env.EVENT_SECRET, "Missing EVENT_SECRET env var");

export const checkEventSecret = (req: Request, res: Response, next: NextFunction): void => {
    {
        if (req.headers["x-hasura-event-secret"] !== process.env.EVENT_SECRET) {
            res.status(401);
            res.send({});
            console.log("Request failed event secret check", req.originalUrl);
            next(new Error("Event secret missing"));
        } else {
            next();
        }
    }
};
