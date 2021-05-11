import { RootLogger } from "@eropple/nestjs-bunyan";
import {
    HasuraInsertEvent,
    HasuraUpdateEvent,
    TrackedHasuraEventHandler,
    TrackedHasuraScheduledEventHandler,
} from "@golevelup/nestjs-hasura";
import { Injectable } from "@nestjs/common";
import * as Bunyan from "bunyan";
import { ChannelStackSyncService } from "./channel-stack/channel-stack-sync/channel-stack-sync.service";
import { Room_Mode_Enum } from "./generated/graphql";
import { ScheduleSyncService } from "./schedule/schedule-sync/schedule-sync.service";

@Injectable()
export class AppService {
    private readonly logger: Bunyan;

    constructor(
        @RootLogger() logger: Bunyan,
        private channelStackSync: ChannelStackSyncService,
        private scheduleSync: ScheduleSyncService
    ) {
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
        // this.logger.info({ event: "Playout_EventUpdated", data: _evt });
    }

    @TrackedHasuraEventHandler({
        triggerName: "ImmediateSwitchCreated",
        tableName: "ImmediateSwitch",
        definition: {
            type: "insert",
        },
        schema: "video",
    })
    handleImmediateSwitchCreated(evt: HasuraInsertEvent<ImmediateSwitchData>): void {
        this.logger.info({ event: "ImmediateSwitchCreated", data: evt });
        this.scheduleSync.handleImmediateSwitch(
            evt.event.data.new.data,
            evt.event.data.new.id,
            evt.event.data.new.eventId
        );
    }

    @TrackedHasuraScheduledEventHandler({
        cronSchedule: "*/2 * * * *",
        name: "SyncChannelStacks",
        payload: {},
    })
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    handleSyncChannelStacks(_evt: any): void {
        this.logger.info({ event: "SyncChannelStacks", data: _evt });
        this.channelStackSync.syncChannelStacks().catch((err) => this.logger.error(err));
    }

    @TrackedHasuraScheduledEventHandler({
        cronSchedule: "*/2 * * * *",
        name: "SyncChannels",
        payload: {},
    })
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    handleSyncChannels(_evt: any): void {
        this.logger.info({ event: "SyncChannels", data: _evt });
        this.scheduleSync.fullScheduleSync().catch((err) => this.logger.error(err));
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

export interface ImmediateSwitchData extends BaseData {
    data: any;
    eventId: string | null;
}
