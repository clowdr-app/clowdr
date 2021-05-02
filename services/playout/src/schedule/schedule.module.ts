import { Module } from "@nestjs/common";
import { RemoteScheduleService } from "./remote-schedule/remote-schedule.service";
import { ScheduleSyncService } from "./schedule-sync/schedule-sync.service";

@Module({
    providers: [ScheduleSyncService, RemoteScheduleService],
    imports: [],
    exports: [ScheduleSyncService],
})
export class ScheduleModule {}
