import { Test, TestingModule } from "@nestjs/testing";
import { ChannelSyncService } from "./channel-sync.service";

describe("ChannelSyncService", () => {
    let service: ChannelSyncService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ChannelSyncService],
        }).compile();

        service = module.get<ChannelSyncService>(ChannelSyncService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
