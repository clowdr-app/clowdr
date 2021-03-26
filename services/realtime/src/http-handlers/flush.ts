import { NextFunction, Request, Response } from "express";

export async function flush(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    if (process.env.SECRET_FOR_FLUSHING) {
        const providedSecret = req.query["secret"] ?? req.headers["x-hasura-presence-flush-secret"];
        if (process.env.SECRET_FOR_FLUSHING === providedSecret) {
            // TODO: Flush only the presence-related keys
            //
            // redisClient.flushall((err, reply) => {
            //     if (err) {
            //         res.status(500).send(err);
            //     } else {
            //         res.status(200).send({ ok: reply });
            //     }
            // });
        } else {
            res.status(403).send("Secret mismatch");
        }
    } else {
        res.status(403).send("No secret configured");
    }
}
