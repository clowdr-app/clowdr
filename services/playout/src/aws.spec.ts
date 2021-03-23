import { Test, TestingModule } from "@nestjs/testing";
import { Aws } from "./aws";

describe("Aws", () => {
    let provider: Aws;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [Aws],
        }).compile();

        provider = module.get<Aws>(Aws);
    });

    it("should be defined", () => {
        expect(provider).toBeDefined();
    });
});
