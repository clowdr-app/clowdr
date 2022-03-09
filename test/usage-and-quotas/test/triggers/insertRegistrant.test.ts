import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { insertRegistrant } from "../../src/lib/registrant";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { getUsage } from "../../src/lib/usage";
import expectError from "../expectError";

describe("checkInsertRegistrant", () => {
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

    it("permits insert when remaining quota > 0", async () => {
        await updateQuota(conference.id, {
            maxRegistrants: 1,
        });
        try {
            await insertRegistrant({
                conferenceId: conference.id,
                displayName: "e2e-test-usage-and-quotas-registrant-1",
            });
        } catch (error: any) {
            throw new Error("Insert registrant should not have failed");
        }
    });

    it("prevents insert when remaining quota = 0", async () => {
        await updateQuota(conference.id, {
            maxRegistrants: 0,
        });
        await expectError(
            "Quota limit reached",
            insertRegistrant({
                conferenceId: conference.id,
                displayName: "e2e-test-usage-and-quotas-registrant-1",
            })
        );
    });

    it("prevents insert when remaining quota < 0", async () => {
        await updateQuota(conference.id, {
            maxRegistrants: 1,
        });
        await insertRegistrant({
            conferenceId: conference.id,
            displayName: "e2e-test-usage-and-quotas-registrant-1",
        });
        await updateQuota(conference.id, {
            maxRegistrants: 0,
        });
        await expectError(
            "Quota limit reached",
            insertRegistrant({
                conferenceId: conference.id,
                displayName: "e2e-test-usage-and-quotas-registrant-1",
            })
        );
    });

    it("prevented insert returns useful error message", async () => {
        await updateQuota(conference.id, {
            maxRegistrants: 0,
        });
        await expectError(
            "Quota limit reached",
            insertRegistrant({
                conferenceId: conference.id,
                displayName: "e2e-test-usage-and-quotas-registrant-1",
            })
        );
    });
});
