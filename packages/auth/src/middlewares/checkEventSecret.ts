import type { NextFunction, Request, Response } from "express";

export const checkEventSecret = (req: Request, res: Response, next: NextFunction): void => {
    {
        if (
            req.headers["x-hasura-event-secret"] !== process.env.EVENT_SECRET &&
            req.headers["X-Hasura-Event-Secret"] !== process.env.EVENT_SECRET &&
            req.headers["X-HASURA-EVENT-SECRET"] !== process.env.EVENT_SECRET
        ) {
            res.status(401);
            res.send({});
            req.log.error("Request failed event secret check");
            next(new Error("Event secret missing"));
        } else {
            next();
        }
    }
};
