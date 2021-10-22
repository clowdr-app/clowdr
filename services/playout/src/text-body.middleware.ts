import type { NestMiddleware } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { NextFunction } from "connect";
import { text } from "express";
import type { IncomingMessage, ServerResponse } from "http";

@Injectable()
export class TextBodyMiddleware implements NestMiddleware {
    use(req: IncomingMessage, res: ServerResponse, next: NextFunction): void {
        text()(req, res, next);
    }
}
