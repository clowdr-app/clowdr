import { Logger } from "@eropple/nestjs-bunyan";
import { Controller, Get } from "@nestjs/common";
import * as Bunyan from "bunyan";
import { AppService } from "./app.service";

@Controller()
export class AppController {
    private readonly _logger: Bunyan;

    constructor(@Logger() requestLogger: Bunyan, private readonly appService: AppService) {
        this._logger = requestLogger.child({ component: this.constructor.name });
    }

    @Get()
    getHello(): string {
        this._logger.info("getHello");
        return this.appService.getHello();
    }
}
