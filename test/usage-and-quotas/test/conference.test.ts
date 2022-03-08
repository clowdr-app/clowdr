import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { TestConferenceFragment } from "../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../src/lib/conference";

describe("Insert conference", () => {
    it("creates a conference", async () => {
        const response = await createTestConference();
        expect(response).toBeDefined();
        expect(response.error).toBeUndefined();
        expect(response.data).toBeDefined();
        expect(response.data.insert_conference_Conference_one).toBeDefined();
        expect(response.data.insert_conference_Conference_one.id).toBeDefined();
        if (response.data?.insert_conference_Conference_one?.id) {
            await cleanupTestConference(response.data?.insert_conference_Conference_one?.id);
        }
    });
});

describe("conference.Conference.insertUsagesAndQuota (Postgres trigger)", () => {
    let conference: TestConferenceFragment | undefined;

    beforeEach(async () => {
        conference = (await createTestConference())?.data?.insert_conference_Conference_one;
    });
    afterEach(async () => {
        if (conference) {
            await cleanupTestConference(conference.id);
        }
    });

    it("creates a default quota record", () => {
        expect(conference?.quota?.id).toBeDefined();
    });

    it("creates a default usage record", () => {
        expect(conference?.usage?.id).toBeDefined();
    });
});
