import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { insertSubconference } from "../../src/lib/subconference";
import { getUsage } from "../../src/lib/usage";
import extractActualError from "./extractError";

describe("checkInsertSubconference", () => {
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
            maxSubconferences: 1,
        });
        try {
            await insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-1",
                shortName: "e2e-test-usage-and-quotas-subconference-1",
                slug: "e2e-test-usage-and-quotas-subconference-1",
            });
        } catch (error: any) {
            throw new Error("Insert subconference should not have failed");
        }
    });

    it.fails("prevents insert when remaining quota = 0", async () => {
        await updateQuota(conference.id, {
            maxSubconferences: 0,
        });
        await insertSubconference({
            conferenceId: conference.id,
            name: "e2e-test-usage-and-quotas-subconference-1",
            shortName: "e2e-test-usage-and-quotas-subconference-1",
            slug: "e2e-test-usage-and-quotas-subconference-1",
        });
    });

    it.fails("prevents insert when remaining quota < 0", async () => {
        await updateQuota(conference.id, {
            maxSubconferences: 1,
        });
        await insertSubconference({
            conferenceId: conference.id,
            name: "e2e-test-usage-and-quotas-subconference-1",
            shortName: "e2e-test-usage-and-quotas-subconference-1",
            slug: "e2e-test-usage-and-quotas-subconference-1",
        });
        await updateQuota(conference.id, {
            maxSubconferences: 0,
        });
        await insertSubconference({
            conferenceId: conference.id,
            name: "e2e-test-usage-and-quotas-subconference-1",
            shortName: "e2e-test-usage-and-quotas-subconference-1",
            slug: "e2e-test-usage-and-quotas-subconference-1",
        });
    });

    it("prevented insert returns useful error message", async () => {
        await updateQuota(conference.id, {
            maxSubconferences: 0,
        });
        await expect(
            insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-1",
                shortName: "e2e-test-usage-and-quotas-subconference-1",
                slug: "e2e-test-usage-and-quotas-subconference-1",
            }).catch((err) => {
                throw extractActualError(err);
            })
        ).rejects.toThrowError("Quota limit reached");
    });
});
