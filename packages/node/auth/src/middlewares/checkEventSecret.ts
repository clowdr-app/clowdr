import type { AWSClient } from "@midspace/component-clients/aws/client";
import type { NextFunction, Request, Response } from "express";

export const checkEventSecret = (
    awsClient: AWSClient
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return async (req, res, next) => {
        {
            const secret = await awsClient.getSecret(`${awsClient.serviceName}_EVENT_SECRET`);
            const providedSecret = req.get("x-hasura-event-secret");
            if (providedSecret !== secret) {
                res.status(401);
                res.send({});
                req.log.error("Request failed event secret check");
                next(new Error(providedSecret !== undefined ? "Event secret incorrect" : "Event secret missing"));
            } else {
                next();
            }
        }
    };
};
