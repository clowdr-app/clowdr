import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { Content_ItemType_Enum } from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { insertItem } from "../../src/lib/item";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { getUsage } from "../../src/lib/usage";
import expectError from "../expectError";

describe("checkInsertItem", () => {
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

    describe("non-sponsors", () => {
        it("permits insert when remaining quota > 0", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Paper,
            });
        });

        it("prevents insert when remaining quota = 0", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 0,
            });

            await expectError(
                "Quota limit reached (total content items)",
                insertItem({
                    conferenceId: conference.id,
                    title: "Test Content Item",
                    typeName: Content_ItemType_Enum.Paper,
                })
            );
        });

        it("prevents insert when remaining quota < 0", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item 1",
                typeName: Content_ItemType_Enum.Paper,
            });

            await updateQuota(conference.id, {
                maxContentItems: 0,
            });

            await expectError(
                "Quota limit reached (total content items)",
                insertItem({
                    conferenceId: conference.id,
                    title: "Test Content Item 2",
                    typeName: Content_ItemType_Enum.Paper,
                })
            );
        });
    });

    describe("sponsors", () => {
        it("permits insert when remaining quota > 0", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Sponsor,
            });
        });

        it("permits insert when remaining quota <= 0", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 0,
            });

            await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Sponsor,
            });
        });
    });
});
