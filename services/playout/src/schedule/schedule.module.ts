import { Module } from "@nestjs/common";
import { ScheduleSyncService } from "./schedule-sync/schedule-sync.service";

@Module({
    providers: [ScheduleSyncService],
    imports: [],
    exports: [ScheduleSyncService],
})
export class ScheduleModule {}
