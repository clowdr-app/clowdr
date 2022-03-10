import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { Room_ManagementMode_Enum } from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { insertRoom, updateRoom } from "../../src/lib/room";
import { getUsage } from "../../src/lib/usage";
import expectError from "../expectError";

describe("checkInsertRoom", () => {
    let conference: TestConferenceFragment;
    let initialQuota: QuotaFragment;
    let initialUsage: UsageFragment;
    let initialRemainingQuota: RemainingQuotaFragment;

    beforeEach(async () => {
        conference = (await createTestConference())?.data?.insert_conference_Conference_one;
        expect(conference).toBeDefined();

        initialQuota = await getQuota(conference.id);
        initialUsage = await getUsage(conference.id);
        initialRemainingQuota = await getRemainingQuota(conference.id);

        expect(initialQuota).toBeDefined();
        expect(initialUsage).toBeDefined();
        expect(initialRemainingQuota).toBeDefined();
    });
    afterEach(async () => {
        if (conference) {
            await cleanupTestConference(conference.id);
        }
    });

    describe("public rooms", () => {
        it("permits change to any field other than mode", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 1,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room",
            });
            await updateRoom(room.id, {
                name: "E2E Usage-and-Quotas Test Room - Renamed",
            });
        });

        it("permits change of mode", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 1,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room",
            });

            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            await updateRoom(room.id, {
                managementModeName: Room_ManagementMode_Enum.Private,
            });
        });
    });

    describe("non-public rooms", () => {
        it("permits change to any field other than mode", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Private,
                name: "E2E Usage-and-Quotas Test Room",
            });
            await updateRoom(room.id, {
                name: "E2E Usage-and-Quotas Test Room - Renamed",
            });
        });

        it("permits change of mode to another non-public mode", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Private,
                name: "E2E Usage-and-Quotas Test Room",
            });
            await updateRoom(room.id, {
                managementModeName: Room_ManagementMode_Enum.Managed,
            });
        });

        it("permits change of mode to public when sum of remaining quotas > 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 1,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Private,
                name: "E2E Usage-and-Quotas Test Room",
            });
            await updateRoom(room.id, {
                managementModeName: Room_ManagementMode_Enum.Public,
            });
        });

        it("prevents change of mode to public when sum of remaining quotas <= 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 1,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room 1",
            });
            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Private,
                name: "E2E Usage-and-Quotas Test Room 2",
            });
            await expectError(
                "Quota limit reached (total public rooms)",
                updateRoom(room.id, {
                    managementModeName: Room_ManagementMode_Enum.Public,
                })
            );
        });
    });
});
