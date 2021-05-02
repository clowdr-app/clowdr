import { RootLogger } from "@eropple/nestjs-bunyan";
import {
    HasuraUpdateEvent,
    TrackedHasuraEventHandler,
    TrackedHasuraScheduledEventHandler,
} from "@golevelup/nestjs-hasura";
import { Injectable } from "@nestjs/common";
import * as Bunyan from "bunyan";
import { ChannelSyncService } from "./channels/channel-sync/channel-sync.service";
import { Room_Mode_Enum } from "./generated/graphql";

@Injectable()
export class AppService {
    private readonly logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private channelSync: ChannelSyncService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    getHello(): string {
        return "Hello World!";
    }

    @TrackedHasuraEventHandler({
        triggerName: "Playout_EventUpdated",
        tableName: "Event",
        definition: {
            type: "update",
        },
        schema: "public",
    })
    handlePlayout_EventUpdated(_evt: HasuraUpdateEvent<EventData>): void {
        this.logger.info({ event: "Playout_EventUpdated", data: _evt });
    }

    @TrackedHasuraScheduledEventHandler({
        cronSchedule: "*/2 * * * *",
        name: "SyncChannelStacks",
        payload: {},
    })
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    handleSyncChannelStacks(_evt: any): void {
        this.logger.info({ event: "SyncChannelStacks", data: _evt });
        this.channelSync.syncChannelStacks().catch((err) => this.logger.error(err));
    }
}

export interface BaseData {
    created_at: string;
    updated_at: string;
    id: string;
}

export interface EventData extends BaseData {
    durationSeconds: number;
    intendedRoomModeName: Room_Mode_Enum;
    name: string;
    endTime: string | null;
    startTime: string;
    conferenceId: string;
    itemId: string | null;
    originatingDataId: string | null;
    roomId: string;
}
