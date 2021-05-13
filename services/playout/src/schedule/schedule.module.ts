import { Module } from "@nestjs/common";
import { ImmediateSwitchService } from "./immediate-switch/immediate-switch.service";
import { RemoteScheduleService } from "./remote-schedule/remote-schedule.service";
import { ScheduleSyncService } from "./schedule-sync/schedule-sync.service";
import { VonageService } from "./vonage/vonage.service";

@Module({
    providers: [ScheduleSyncService, RemoteScheduleService, VonageService, ImmediateSwitchService],
    imports: [],
    exports: [ScheduleSyncService, ImmediateSwitchService],
})
export class ScheduleModule {}
