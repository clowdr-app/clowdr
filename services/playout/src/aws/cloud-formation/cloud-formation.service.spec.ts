import { Test, TestingModule } from "@nestjs/testing";
import { CloudFormationService } from "./cloud-formation.service";

describe("CloudFormationService", () => {
    let service: CloudFormationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CloudFormationService],
        }).compile();

        service = module.get<CloudFormationService>(CloudFormationService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });

    describe("parseCloudFormationEvent", () => {
        it("should return expected result on sample input", () => {
            const stackId = "arn:eu-1:1234:stack/foo/bar";
            const timestamp = "2021-03-29T16:23:55.358Z";
            const resourceProperties = {
                Type: "RTMP_PUSH",
                Destinations: [{ StreamName: "rtmpBInput" }],
                InputSecurityGroups: ["6683279"],
                Tags: { environment: "ross-dev", roomId: "myroom123" },
                Name: "C6yml0",
            };
            const message = `StackId='${stackId}'\nTimestamp='${timestamp}'\nResourceProperties='${JSON.stringify(
                resourceProperties
            )}'`;

            const parsed = service.parseCloudFormationEvent(message);

            expect(parsed["StackId"]).toBe(stackId);
            expect(parsed["Timestamp"]).toBe(timestamp);
            expect(JSON.parse(parsed["ResourceProperties"])).toEqual(resourceProperties);
        });
        it("should handle unusual newline patterns", () => {
            const stackId = "arn:eu-1:1234:stack/foo/bar";
            const timestamp = "2021-03-29T16:23:55.358Z";
            const resourceProperties = {
                Type: "RTMP_PUSH",
                Destinations: [{ StreamName: "rtmpBInput" }],
                InputSecurityGroups: ["6683279"],
                Tags: { environment: "ross-dev", roomId: "myroom123" },
                Name: "C6yml0",
            };
            const message = `StackId='${stackId}'\n\rTimestamp='${timestamp}'\r\r\n\nResourceProperties='${JSON.stringify(
                resourceProperties
            )}'\n`;

            const parsed = service.parseCloudFormationEvent(message);

            expect(parsed["StackId"]).toBe(stackId);
            expect(parsed["Timestamp"]).toBe(timestamp);
            expect(JSON.parse(parsed["ResourceProperties"])).toEqual(resourceProperties);
        });
    });
});
