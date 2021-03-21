import { gql } from "@apollo/client/core";
import { BunyanLoggerService } from "@eropple/nestjs-bunyan-logger";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ROOT_LOGGER } from "./logger";

gql`
    query GetMediaLiveChannelByRoom($roomId: uuid!) {
        Room_by_pk(id: $roomId) {
            id
            conferenceId
            mediaLiveChannel {
                id
                mediaLiveChannelId
                mp4InputAttachmentName
                vonageInputAttachmentName
                loopingMp4InputAttachmentName
            }
        }
    }
`;

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: new BunyanLoggerService(ROOT_LOGGER),
    });
    await app.listen(3003);
}
bootstrap();
