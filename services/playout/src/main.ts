import { BunyanLoggerService } from "@eropple/nestjs-bunyan-logger";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ROOT_LOGGER } from "./logger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
        logger: new BunyanLoggerService(ROOT_LOGGER),
    });
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(process.env.PORT ? parseInt(process.env.PORT, 10) : 3003);
}
bootstrap();
