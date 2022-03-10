import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    ItemFragment,
    QuotaFragment,
    RemainingQuotaFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { Content_ElementType_Enum, Content_ItemType_Enum } from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { insertElement } from "../../src/lib/element";
import { insertItem } from "../../src/lib/item";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { getUsage } from "../../src/lib/usage";
import expectError from "../expectError";

describe("checkInsertElement", () => {
    let conference: TestConferenceFragment;
    let initialQuota: QuotaFragment;
    let initialUsage: UsageFragment;
    let initialRemainingQuota: RemainingQuotaFragment;
    let item1: ItemFragment;
    let sponsor1: ItemFragment;

    beforeEach(async () => {
        conference = (await createTestConference())?.data?.insert_conference_Conference_one;
        expect(conference).toBeDefined();

        initialQuota = await getQuota(conference.id);
        initialUsage = await getUsage(conference.id);
        initialRemainingQuota = await getRemainingQuota(conference.id);

        expect(initialQuota).toBeDefined();
        expect(initialUsage).toBeDefined();
        expect(initialRemainingQuota).toBeDefined();

        await updateQuota(conference.id, {
            maxContentItems: 2,
            maxMediaElementsPerContentItem: 1,
            maxMediaElementsPerSponsor: 1,
            maxNonMediaElementsPerContentItem: 1,
            maxNonMediaElementsPerSponsor: 1,
        });

        item1 = await insertItem({
            conferenceId: conference.id,
            title: "Test Content Item 1",
            typeName: Content_ItemType_Enum.Paper,
        });
        sponsor1 = await insertItem({
            conferenceId: conference.id,
            title: "Test Content Item 2",
            typeName: Content_ItemType_Enum.Sponsor,
        });
    });
    afterEach(async () => {
        if (conference) {
            await cleanupTestConference(conference.id);
        }
    });

    it("permits insert if the `source` field equals `EVENT_RECORDING` or `COMBINE_VIDEOS`", async () => {
        await updateQuota(conference.id, {
            maxMediaElementsPerContentItem: 0,
            maxMediaElementsPerSponsor: 0,
            maxNonMediaElementsPerContentItem: 0,
            maxNonMediaElementsPerSponsor: 0,
        });

        await insertElement({
            conferenceId: conference.id,
            itemId: item1.id,
            name: "Test Element",
            source: "EVENT_RECORDING",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
        });
        await insertElement({
            conferenceId: conference.id,
            itemId: item1.id,
            name: "Test Element",
            source: "COMBINE_VIDEOS",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
        });
    });

    describe("non-sponor item", () => {
        describe("media element", () => {
            it("permits insert if count of media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 1,
                    maxMediaElementsPerSponsor: 0,
                    maxNonMediaElementsPerContentItem: 0,
                    maxNonMediaElementsPerSponsor: 0,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: item1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.VideoFile,
                    data: {},
                });
            });

            it("prevents insert if count of media elements on the item is >= max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 1,
                    maxMediaElementsPerSponsor: 0,
                    maxNonMediaElementsPerContentItem: 0,
                    maxNonMediaElementsPerSponsor: 0,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: item1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.VideoFile,
                    data: {},
                });
                await expectError(
                    "Quota limit reached (media elements per item)",
                    insertElement({
                        conferenceId: conference.id,
                        itemId: item1.id,
                        name: "Test Element",
                        typeName: Content_ElementType_Enum.VideoFile,
                        data: {},
                    })
                );
            });
        });

        describe("non-media element", () => {
            it("permits insert if count of non-media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 0,
                    maxMediaElementsPerSponsor: 0,
                    maxNonMediaElementsPerContentItem: 1,
                    maxNonMediaElementsPerSponsor: 0,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: item1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.Text,
                    data: {},
                });
            });

            it("prevents insert if count of non-media elements on the item is >= max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 0,
                    maxMediaElementsPerSponsor: 0,
                    maxNonMediaElementsPerContentItem: 1,
                    maxNonMediaElementsPerSponsor: 0,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: item1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.Text,
                    data: {},
                });
                await expectError(
                    "Quota limit reached (non-media elements per item)",
                    insertElement({
                        conferenceId: conference.id,
                        itemId: item1.id,
                        name: "Test Element",
                        typeName: Content_ElementType_Enum.Text,
                        data: {},
                    })
                );
            });
        });
    });

    describe("sponor item", () => {
        describe("media element", () => {
            it("permits insert if count of media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 0,
                    maxMediaElementsPerSponsor: 1,
                    maxNonMediaElementsPerContentItem: 0,
                    maxNonMediaElementsPerSponsor: 0,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: sponsor1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.VideoFile,
                    data: {},
                });
            });

            it("prevents insert if count of media elements on the item is >= max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 0,
                    maxMediaElementsPerSponsor: 1,
                    maxNonMediaElementsPerContentItem: 0,
                    maxNonMediaElementsPerSponsor: 0,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: sponsor1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.VideoFile,
                    data: {},
                });
                await expectError(
                    "Quota limit reached (media elements per sponsor)",
                    insertElement({
                        conferenceId: conference.id,
                        itemId: sponsor1.id,
                        name: "Test Element",
                        typeName: Content_ElementType_Enum.VideoFile,
                        data: {},
                    })
                );
            });
        });

        describe("non-media element", () => {
            it("permits insert if count of non-media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 0,
                    maxMediaElementsPerSponsor: 0,
                    maxNonMediaElementsPerContentItem: 0,
                    maxNonMediaElementsPerSponsor: 1,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: sponsor1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.Text,
                    data: {},
                });
            });

            it("prevents insert if count of non-media elements on the item is >= max", async () => {
                await updateQuota(conference.id, {
                    maxContentItems: 2,
                    maxMediaElementsPerContentItem: 0,
                    maxMediaElementsPerSponsor: 0,
                    maxNonMediaElementsPerContentItem: 0,
                    maxNonMediaElementsPerSponsor: 1,
                });

                await insertElement({
                    conferenceId: conference.id,
                    itemId: sponsor1.id,
                    name: "Test Element",
                    typeName: Content_ElementType_Enum.Text,
                    data: {},
                });
                await expectError(
                    "Quota limit reached (non-media elements per sponsor)",
                    insertElement({
                        conferenceId: conference.id,
                        itemId: sponsor1.id,
                        name: "Test Element",
                        typeName: Content_ElementType_Enum.Text,
                        data: {},
                    })
                );
            });
        });
    });
});
