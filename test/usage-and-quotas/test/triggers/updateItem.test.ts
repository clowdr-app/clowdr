import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { Content_ItemType_Enum } from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { insertItem, updateItem } from "../../src/lib/item";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { getUsage } from "../../src/lib/usage";
import expectError from "../expectError";

describe("checkUpdateItem", () => {
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
        it("permits change to any field other than typeName", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            const item = await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Paper,
            });
            await updateItem(item.id, {
                shortTitle: "Test Content Item - Re-titled",
            });
        });

        it("permits change to typeName to another non-sponsor typeName", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            const item = await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Paper,
            });
            await updateItem(item.id, {
                typeName: Content_ItemType_Enum.Poster,
            });
        });

        it("permits change to typeName to sponsor", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            const item = await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Paper,
            });
            await updateQuota(conference.id, {
                maxContentItems: 0,
            });
            await updateItem(item.id, {
                typeName: Content_ItemType_Enum.Sponsor,
            });
        });
    });

    describe("sponsors", () => {
        it("permits change to any field other than typeName", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 0,
            });

            const item = await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Sponsor,
            });
            await updateItem(item.id, {
                shortTitle: "Test short title",
            });
        });

        it("permits change to typeName to non-sponsor typeName when remaining quota > 0", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            const item = await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Sponsor,
            });
            await updateItem(item.id, {
                typeName: Content_ItemType_Enum.Paper,
            });
        });

        it("prevents change to typeName to non-sponsor typeName when remaining quota <= 0", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 0,
            });

            const item = await insertItem({
                conferenceId: conference.id,
                title: "Test Content Item",
                typeName: Content_ItemType_Enum.Sponsor,
            });
            await expectError(
                "Quota limit reached (total public contents)",
                updateItem(item.id, {
                    typeName: Content_ItemType_Enum.Paper,
                })
            );
        });
    });
});
