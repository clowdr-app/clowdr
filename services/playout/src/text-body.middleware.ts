import { Injectable, NestMiddleware } from "@nestjs/common";
import { text } from "body-parser";
import { Request, Response } from "express";

@Injectable()
export class TextBodyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => any): void {
        text()(req, res, next);
    }
}
