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
import { insertRoom } from "../../src/lib/room";
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
        it("permits insert when remainingStreamingProgramRooms > 0 and others are 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room",
            });
        });

        it("permits insert when remainingNonStreamingProgramRooms > 0 and others are 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 1,
                maxPublicSocialRooms: 0,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room",
            });
        });

        it("permits insert when remainingPublicSocialRooms > 0 and others are 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 1,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room",
            });
        });

        it("prevents insert when all remaining quotas = 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            await expectError(
                "Quota limit reached (total public rooms)",
                insertRoom({
                    conferenceId: conference.id,
                    capacity: 50,
                    managementModeName: Room_ManagementMode_Enum.Public,
                    name: "E2E Usage-and-Quotas Test Room",
                })
            );
        });

        it("prevents insert when sum of remaining quotas = 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                maxPublicSocialRooms: 1,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room 1",
            });
            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room 2",
            });
            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room 3",
            });

            await expectError(
                "Quota limit reached (total public rooms)",
                insertRoom({
                    conferenceId: conference.id,
                    capacity: 50,
                    managementModeName: Room_ManagementMode_Enum.Public,
                    name: "E2E Usage-and-Quotas Test Room 4",
                })
            );
        });

        it("prevents insert when sum of remaining quotas < 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                maxPublicSocialRooms: 1,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room 1",
            });
            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room 2",
            });
            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Room 3",
            });

            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            await expectError(
                "Quota limit reached (total public rooms)",
                insertRoom({
                    conferenceId: conference.id,
                    capacity: 50,
                    managementModeName: Room_ManagementMode_Enum.Public,
                    name: "E2E Usage-and-Quotas Test Room 4",
                })
            );
        });
    });

    describe("private rooms", () => {
        it("permits insert when sum of remaining quotas <= 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Private,
                name: "E2E Usage-and-Quotas Test Private Room",
            });
        });
    });

    describe("dm rooms", () => {
        it("permits insert when sum of remaining quotas <= 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Dm,
                name: "E2E Usage-and-Quotas Test DM Room",
            });
        });
    });

    describe("managed rooms", () => {
        it("permits insert when sum of remaining quotas <= 0", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 0,
                maxPublicSocialRooms: 0,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Managed,
                name: "E2E Usage-and-Quotas Test Managed Room",
            });
        });
    });
});
