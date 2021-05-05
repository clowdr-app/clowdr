import { Module } from "@nestjs/common";
import { RemoteScheduleService } from "./remote-schedule/remote-schedule.service";
import { ScheduleSyncService } from "./schedule-sync/schedule-sync.service";
import { VonageService } from "./vonage/vonage.service";

@Module({
    providers: [ScheduleSyncService, RemoteScheduleService, VonageService],
    imports: [],
    exports: [ScheduleSyncService],
})
export class ScheduleModule {}
