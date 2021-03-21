import { RootLogger } from "@eropple/nestjs-bunyan";
import {
    HasuraUpdateEvent,
    TrackedHasuraEventHandler,
    TrackedHasuraScheduledEventHandler,
} from "@golevelup/nestjs-hasura";
import { Injectable } from "@nestjs/common";
import * as Bunyan from "bunyan";
import { RoomMode_Enum } from "./generated/graphql";

@Injectable()
export class AppService {
    private readonly _logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan) {
        this._logger = logger.child({ component: this.constructor.name });
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
        this._logger.info({ event: "Playout_EventUpdated", data: _evt });
    }

    @TrackedHasuraScheduledEventHandler({
        cronSchedule: "*/2 * * * *",
        name: "SyncChannels",
        payload: {},
    })
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    handleSyncChannels(_evt: any): void {
        this._logger.info({ event: "SyncChannels", data: _evt });
    }
}

export interface BaseData {
    created_at: string;
    updated_at: string;
    id: string;
}

export interface EventData extends BaseData {
    durationSeconds: number;
    intendedRoomModeName: RoomMode_Enum;
    name: string;
    endTime: string | null;
    startTime: string;
    conferenceId: string;
    contentGroupId: string | null;
    originatingDataId: string | null;
    roomId: string;
}
