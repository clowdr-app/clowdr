import type { NextFunction, Request, RequestHandler, Response } from "express";

function sequentialIdGeneratorFactory() {
    const maxInt = 2147483647;
    let nextId = 0;
    return function next() {
        return (nextId = (nextId + 1) & maxInt);
    };
}

export const requestId = (): RequestHandler => {
    const generateId = sequentialIdGeneratorFactory();
    return (req: Request, _res: Response, next: NextFunction): void => {
        req.id = req.get("X-Request-Id") ?? generateId();
        next();
    };
};
