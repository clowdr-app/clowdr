import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    ElementFragment,
    ItemFragment,
    QuotaFragment,
    RemainingQuotaFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { Content_ElementType_Enum, Content_ItemType_Enum } from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { insertElement, updateElement } from "../../src/lib/element";
import { insertItem } from "../../src/lib/item";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { getUsage } from "../../src/lib/usage";
import expectError from "../expectError";

describe("checkUpdateElement", () => {
    let conference: TestConferenceFragment;
    let initialQuota: QuotaFragment;
    let initialUsage: UsageFragment;
    let initialRemainingQuota: RemainingQuotaFragment;
    let item1: ItemFragment;
    let itemMediaElement1: ElementFragment;
    let itemNonMediaElement1: ElementFragment;
    let itemEventRecordingElement1: ElementFragment;
    let itemCombineVideosElement1: ElementFragment;

    let sponsor1: ItemFragment;
    let sponsorMediaElement1: ElementFragment;
    let sponsorNonMediaElement1: ElementFragment;
    let sponsorEventRecordingElement1: ElementFragment;
    let sponsorCombineVideosElement1: ElementFragment;

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
        itemMediaElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: item1.id,
            name: "Test Media Element",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
        });
        itemNonMediaElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: item1.id,
            name: "Test Non-Media Element",
            typeName: Content_ElementType_Enum.Text,
            data: {},
        });
        itemEventRecordingElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: item1.id,
            name: "Test Event Recording Element",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
            source: "EVENT_RECORDING",
        });
        itemCombineVideosElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: item1.id,
            name: "Test Combine Videos Element",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
            source: "COMBINE_VIDEOS",
        });

        sponsor1 = await insertItem({
            conferenceId: conference.id,
            title: "Test Content Item 2",
            typeName: Content_ItemType_Enum.Sponsor,
        });
        sponsorMediaElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: sponsor1.id,
            name: "Test Media Element",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
        });
        sponsorNonMediaElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: sponsor1.id,
            name: "Test Non-Media Element",
            typeName: Content_ElementType_Enum.Text,
            data: {},
        });
        sponsorEventRecordingElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: sponsor1.id,
            name: "Test Event Recording Element",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
            source: "EVENT_RECORDING",
        });
        sponsorCombineVideosElement1 = await insertElement({
            conferenceId: conference.id,
            itemId: sponsor1.id,
            name: "Test Combine Videos Element",
            typeName: Content_ElementType_Enum.VideoFile,
            data: {},
            source: "COMBINE_VIDEOS",
        });
    });
    afterEach(async () => {
        if (conference) {
            await cleanupTestConference(conference.id);
        }
    });

    it("permits update if typeName is unchanged", async () => {
        await updateElement(itemMediaElement1.id, {
            name: "Test Media Element - Renamed",
        });
        await updateElement(itemNonMediaElement1.id, {
            name: "Test Non-Media Element - Renamed",
        });

        await updateElement(sponsorMediaElement1.id, {
            name: "Test Media Element - Renamed",
        });
        await updateElement(sponsorNonMediaElement1.id, {
            name: "Test Non-Media Element - Renamed",
        });
    });

    it("permits update if the `source` field equals `EVENT_RECORDING` or `COMBINE_VIDEOS`", async () => {
        await updateElement(itemEventRecordingElement1.id, {
            name: "Test Event Recording Element - Renamed",
            typeName: Content_ElementType_Enum.Abstract,
        });
        await updateElement(itemCombineVideosElement1.id, {
            name: "Test Combine Videos Element - Renamed",
            typeName: Content_ElementType_Enum.Abstract,
        });

        await updateElement(sponsorEventRecordingElement1.id, {
            name: "Test Event Recording Element - Renamed",
            typeName: Content_ElementType_Enum.Abstract,
        });
        await updateElement(sponsorCombineVideosElement1.id, {
            name: "Test Combine Videos Element - Renamed",
            typeName: Content_ElementType_Enum.Abstract,
        });
    });

    describe("non-sponsor item", () => {
        describe("media element", () => {
            it("permits update to typeName if count of non-media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxMediaElementsPerContentItem: 1,
                    maxMediaElementsPerSponsor: 1,
                    maxNonMediaElementsPerContentItem: 2,
                    maxNonMediaElementsPerSponsor: 1,
                });
                await updateElement(itemMediaElement1.id, {
                    typeName: Content_ElementType_Enum.Text,
                });
            });

            it("prevents update to typeName if count of non-media elements on the item is >= max", async () => {
                await expectError(
                    "Quota limit reached (non-media elements per item)",
                    updateElement(itemMediaElement1.id, {
                        typeName: Content_ElementType_Enum.Text,
                    })
                );
            });
        });

        describe("non-media element", () => {
            it("permits update to typeName if count of media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxMediaElementsPerContentItem: 4,
                    maxMediaElementsPerSponsor: 1,
                    maxNonMediaElementsPerContentItem: 1,
                    maxNonMediaElementsPerSponsor: 1,
                });
                await updateElement(itemNonMediaElement1.id, {
                    typeName: Content_ElementType_Enum.VideoFile,
                });
            });

            it("prevents update to typeName if count of media elements on the item is >= max", async () => {
                await expectError(
                    "Quota limit reached (media elements per item)",
                    updateElement(itemNonMediaElement1.id, {
                        typeName: Content_ElementType_Enum.VideoFile,
                    })
                );
            });
        });
    });

    describe("sponsor item", () => {
        describe("media element", () => {
            it("permits update to typeName if count of non-media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxMediaElementsPerContentItem: 1,
                    maxMediaElementsPerSponsor: 1,
                    maxNonMediaElementsPerContentItem: 1,
                    maxNonMediaElementsPerSponsor: 2,
                });
                await updateElement(sponsorMediaElement1.id, {
                    typeName: Content_ElementType_Enum.Text,
                });
            });

            it("prevents update to typeName if count of non-media elements on the item is >= max", async () => {
                await expectError(
                    "Quota limit reached (non-media elements per sponsor)",
                    updateElement(sponsorMediaElement1.id, {
                        typeName: Content_ElementType_Enum.Text,
                    })
                );
            });
        });

        describe("non-media element", () => {
            it("permits update to typeName if count of media elements on the item is < max", async () => {
                await updateQuota(conference.id, {
                    maxMediaElementsPerContentItem: 1,
                    maxMediaElementsPerSponsor: 4,
                    maxNonMediaElementsPerContentItem: 1,
                    maxNonMediaElementsPerSponsor: 1,
                });
                await updateElement(sponsorNonMediaElement1.id, {
                    typeName: Content_ElementType_Enum.VideoFile,
                });
            });

            it("prevents update to typeName if count of media elements on the item is >= max", async () => {
                await expectError(
                    "Quota limit reached (media elements per sponsor)",
                    updateElement(sponsorNonMediaElement1.id, {
                        typeName: Content_ElementType_Enum.VideoFile,
                    })
                );
            });
        });
    });
});
