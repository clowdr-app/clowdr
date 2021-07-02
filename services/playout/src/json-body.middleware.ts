import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction } from "connect";
import { json } from "express";
import { IncomingMessage, ServerResponse } from "http";

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
    use(req: IncomingMessage, res: ServerResponse, next: NextFunction): void {
        json()(req, res, next);
    }
}
