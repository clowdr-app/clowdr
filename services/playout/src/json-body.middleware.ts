import { Injectable, NestMiddleware } from "@nestjs/common";
import { json } from "body-parser";
import { Request, Response } from "express";

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => any): void {
        json()(req, res, next);
    }
}
