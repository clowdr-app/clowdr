import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { HttpException, HttpStatus, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import MessageValidator from "sns-validator";
import { promisify } from "util";

@Injectable()
export class SnsNotificationMiddleware implements NestMiddleware {
    private readonly _logger: Bunyan;

    constructor(@RootLogger() requestLogger: Bunyan) {
        this._logger = requestLogger.child({ component: this.constructor.name });
    }

    async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
        const validator = new MessageValidator();
        const validate = promisify(validator.validate.bind(validator));

        try {
            req.body = JSON.parse(req.body);
            await validate(req.body);
        } catch (e) {
            this._logger.warn({ err: e, req: req.body }, "Invalid SNS notification");
            throw new HttpException("Invalid notification", HttpStatus.UNAUTHORIZED);
        }
        next();
    }
}
