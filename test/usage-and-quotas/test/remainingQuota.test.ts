import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    RoomFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../src/generated/graphql";
import { Content_ItemType_Enum, Room_ManagementMode_Enum, Room_Mode_Enum } from "../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../src/lib/conference";
import { deleteEvent, insertEvent } from "../src/lib/event";
import { deleteItem, insertItem } from "../src/lib/item";
import { getQuota, updateQuota } from "../src/lib/quota";
import { deleteRegistrant, insertRegistrant } from "../src/lib/registrant";
import { getRemainingQuota } from "../src/lib/remainingQuota";
import { deleteRoom, insertRoom } from "../src/lib/room";
import { deleteSubconference, insertSubconference } from "../src/lib/subconference";
import { getUsage, updateUsage } from "../src/lib/usage";

describe("RemainingQuota", () => {
    let conference: TestConferenceFragment;
    let initialQuota: QuotaFragment;
    let initialUsage: UsageFragment;
    let initialRemainingQuota: RemainingQuotaFragment;
    let streamingRoom1: RoomFragment;
    let videoChatRoom1: RoomFragment;

    beforeEach(async () => {
        await cleanupTestConference();

        conference = (await createTestConference())?.data?.insert_conference_Conference_one;
        expect(conference).toBeDefined();

        initialQuota = await getQuota(conference.id);
        initialUsage = await getUsage(conference.id);
        initialRemainingQuota = await getRemainingQuota(conference.id);
        streamingRoom1 = await insertRoom({
            conferenceId: conference.id,
            capacity: 50,
            managementModeName: Room_ManagementMode_Enum.Public,
            name: "E2E Usage-and-Quotas Test Streaming Room 1",
        });
        videoChatRoom1 = await insertRoom({
            conferenceId: conference.id,
            capacity: 50,
            managementModeName: Room_ManagementMode_Enum.Public,
            name: "E2E Usage-and-Quotas Test Video-Chat Room 1",
        });

        expect(initialQuota).toBeDefined();
        expect(initialUsage).toBeDefined();
        expect(initialRemainingQuota).toBeDefined();
        expect(streamingRoom1).toBeDefined();
        expect(videoChatRoom1).toBeDefined();
    });
    afterEach(cleanupTestConference);

    describe("remainingSubconferences", () => {
        it("is initially zero", () => {
            expect(initialRemainingQuota.remainingSubconferences).toBe(0);
        });

        it("initially matches the default quota", () => {
            expect(initialRemainingQuota.remainingSubconferences).toBe(initialQuota.maxSubconferences);
        });

        it("matches the quota when quota is non-zero", async () => {
            await updateQuota(conference.id, {
                maxSubconferences: 1,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSubconferences).toBe(1);
        });

        it("matches the expected remaining quota (1 quota / 1 usage / 0 remaining)", async () => {
            await updateQuota(conference.id, {
                maxSubconferences: 1,
            });
            await insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-1",
                shortName: "e2e-test-usage-and-quotas-subconference-1",
                slug: "e2e-test-usage-and-quotas-subconference-1",
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSubconferences).toBe(0);
        });

        it("matches the expected remaining quota (2 quota / 1 usage / 1 remaining)", async () => {
            await updateQuota(conference.id, {
                maxSubconferences: 2,
            });
            await insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-1",
                shortName: "e2e-test-usage-and-quotas-subconference-1",
                slug: "e2e-test-usage-and-quotas-subconference-1",
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSubconferences).toBe(1);
        });

        it("matches the expected remaining quota (2 quota / 2 usage / 0 remaining)", async () => {
            await updateQuota(conference.id, {
                maxSubconferences: 2,
            });

            await insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-1",
                shortName: "e2e-test-usage-and-quotas-subconference-1",
                slug: "e2e-test-usage-and-quotas-subconference-1",
            });
            await insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-2",
                shortName: "e2e-test-usage-and-quotas-subconference-2",
                slug: "e2e-test-usage-and-quotas-subconference-2",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSubconferences).toBe(0);
        });

        it("goes down by one when a subconference is inserted", async () => {
            await updateQuota(conference.id, {
                maxSubconferences: 1,
            });
            const remainingQuotaPreInsert = await getRemainingQuota(conference.id);

            await insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-1",
                shortName: "e2e-test-usage-and-quotas-subconference-1",
                slug: "e2e-test-usage-and-quotas-subconference-1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSubconferences).toBe(remainingQuotaPreInsert.remainingSubconferences - 1);
        });

        it("goes up by one when a subconference is deleted", async () => {
            await updateQuota(conference.id, {
                maxSubconferences: 1,
            });

            const subconference = await insertSubconference({
                conferenceId: conference.id,
                name: "e2e-test-usage-and-quotas-subconference-1",
                shortName: "e2e-test-usage-and-quotas-subconference-1",
                slug: "e2e-test-usage-and-quotas-subconference-1",
            });

            const remainingQuotaPreDelete = await getRemainingQuota(conference.id);
            await deleteSubconference(subconference.id);

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSubconferences).toBe(remainingQuotaPreDelete.remainingSubconferences + 1);
        });
    });

    describe("remainingStreamingEventTotalMinutes", () => {
        it("equals quota when no events exist", async () => {
            expect(initialRemainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialQuota.maxStreamingEventTotalMinutes
            );
        });

        it("increases when quota increases", async () => {
            const change = 100;
            await updateQuota(conference.id, {
                maxStreamingEventTotalMinutes: initialQuota.maxStreamingEventTotalMinutes + change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes + change
            );
        });

        it("decreases when quota decreases", async () => {
            const change = 100;
            await updateQuota(conference.id, {
                maxStreamingEventTotalMinutes: initialQuota.maxStreamingEventTotalMinutes - change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes - change
            );
        });

        it("decreases when usage increases", async () => {
            const change = 100;
            await updateUsage(conference.id, {
                consumedStreamingEventTotalMinutes: initialUsage.consumedStreamingEventTotalMinutes + change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes - change
            );
        });

        it("increases when usage decreases", async () => {
            const change = 100;
            await updateUsage(conference.id, {
                consumedStreamingEventTotalMinutes: initialUsage.consumedStreamingEventTotalMinutes - change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes + change
            );
        });

        it("decreases when future streaming event is created", async () => {
            const duration = 100;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes - duration
            );
        });

        it("decreases when ongoing streaming event is created", async () => {
            const duration = 100;
            const pastDuration = 10;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - pastDuration * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes - (duration - pastDuration)
            );
        });

        it.skip("[Long] increases when time passes during an ongoing streaming event and usage remains unchanged", async () => {
            const duration = 100;
            const pastDuration = 10;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - pastDuration * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });

            const remainingQuotaPreWait = await getRemainingQuota(conference.id);
            await new Promise((resolve) => {
                setTimeout(resolve, 60 * 1000);
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                remainingQuotaPreWait.remainingStreamingEventTotalMinutes + 1
            );
        }, 70000);

        it.skip("[Long] remains unchanged when time passes with no ongoing streaming event and usage remains unchanged", async () => {
            const remainingQuotaPreWait = await getRemainingQuota(conference.id);
            await new Promise((resolve) => {
                setTimeout(resolve, 60 * 1000);
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                remainingQuotaPreWait.remainingStreamingEventTotalMinutes
            );
        }, 70000);

        it("does not change when video-chat event is inserted", async () => {
            const remainingQuotaPreInsert = await getRemainingQuota(conference.id);

            const duration = 100;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                remainingQuotaPreInsert.remainingStreamingEventTotalMinutes
            );
        });

        it("does not change when exhibition event is inserted", async () => {
            const duration = 100;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes
            );
        });

        it("does not change when a past streaming event is inserted", async () => {
            const duration = 100;
            const pastDuration = 110;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - pastDuration * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingStreamingEventTotalMinutes).toBe(
                initialRemainingQuota.remainingStreamingEventTotalMinutes
            );
        });
    });

    describe("remainingVideoChatEventTotalMinutes", () => {
        it("equals quota when no events exist", async () => {
            expect(initialRemainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialQuota.maxVideoChatEventTotalMinutes
            );
        });

        it("increases when quota increases", async () => {
            const change = 100;
            await updateQuota(conference.id, {
                maxVideoChatEventTotalMinutes: initialQuota.maxVideoChatEventTotalMinutes + change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes + change
            );
        });

        it("decreases when quota decreases", async () => {
            const change = 100;
            await updateQuota(conference.id, {
                maxVideoChatEventTotalMinutes: initialQuota.maxVideoChatEventTotalMinutes - change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes - change
            );
        });

        it("decreases when usage increases", async () => {
            const change = 100;
            await updateUsage(conference.id, {
                consumedVideoChatEventTotalMinutes: initialUsage.consumedVideoChatEventTotalMinutes + change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes - change
            );
        });

        it("increases when usage decreases", async () => {
            const change = 100;
            await updateUsage(conference.id, {
                consumedVideoChatEventTotalMinutes: initialUsage.consumedVideoChatEventTotalMinutes - change,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes + change
            );
        });

        it("decreases when future video-chat event is created", async () => {
            const duration = 100;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes - duration
            );
        });

        it("decreases when ongoing video-chat event is created", async () => {
            const duration = 100;
            const pastDuration = 10;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - pastDuration * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes - (duration - pastDuration)
            );
        });

        it.skip("[Long] increases when time passes during an ongoing video-chat event and usage remains unchanged", async () => {
            const duration = 100;
            const pastDuration = 10;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - pastDuration * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });

            const remainingQuotaPreWait = await getRemainingQuota(conference.id);
            await new Promise((resolve) => {
                setTimeout(resolve, 60 * 1000);
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                remainingQuotaPreWait.remainingVideoChatEventTotalMinutes + 1
            );
        }, 70000);

        it.skip("[Long] remains unchanged when time passes with no ongoing video-chat event and usage remains unchanged", async () => {
            const remainingQuotaPreWait = await getRemainingQuota(conference.id);
            await new Promise((resolve) => {
                setTimeout(resolve, 60 * 1000);
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                remainingQuotaPreWait.remainingVideoChatEventTotalMinutes
            );
        }, 70000);

        it("does not change when a streaming event is inserted", async () => {
            const remainingQuotaPreInsert = await getRemainingQuota(conference.id);

            const duration = 100;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                remainingQuotaPreInsert.remainingVideoChatEventTotalMinutes
            );
        });

        it("does not change when exhibition event is inserted", async () => {
            const duration = 100;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes
            );
        });

        it("does not change when a past video-chat event is inserted", async () => {
            const duration = 100;
            const pastDuration = 110;
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - pastDuration * 60 * 1000),
                durationSeconds: duration * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });

            const remainingQuota = await getRemainingQuota(conference.id);
            expect(remainingQuota.remainingVideoChatEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatEventTotalMinutes
            );
        });
    });

    describe("remainingRegistrants", () => {
        it("initially matches the default quota", () => {
            expect(initialRemainingQuota.remainingRegistrants).toBe(initialQuota.maxRegistrants);
        });

        it("matches the quota when quota is non-zero", async () => {
            await updateQuota(conference.id, {
                maxRegistrants: 1,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingRegistrants).toBe(1);
        });

        it("matches the expected remaining quota (1 quota / 1 usage / 0 remaining)", async () => {
            await updateQuota(conference.id, {
                maxRegistrants: 1,
            });
            await insertRegistrant({
                conferenceId: conference.id,
                displayName: "E2E Usage-and-Quotas Test Registrant 1",
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingRegistrants).toBe(0);
        });

        it("matches the expected remaining quota (2 quota / 1 usage / 1 remaining)", async () => {
            await updateQuota(conference.id, {
                maxRegistrants: 2,
            });
            await insertRegistrant({
                conferenceId: conference.id,
                displayName: "E2E Usage-and-Quotas Test Registrant 1",
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingRegistrants).toBe(1);
        });

        it("matches the expected remaining quota (2 quota / 2 usage / 0 remaining)", async () => {
            await updateQuota(conference.id, {
                maxRegistrants: 2,
            });

            await insertRegistrant({
                conferenceId: conference.id,
                displayName: "E2E Usage-and-Quotas Test Registrant 1",
            });
            await insertRegistrant({
                conferenceId: conference.id,
                displayName: "E2E Usage-and-Quotas Test Registrant 2",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingRegistrants).toBe(0);
        });

        it("goes down by one when a registrant is inserted", async () => {
            await updateQuota(conference.id, {
                maxRegistrants: 1,
            });
            const remainingQuotaPreInsert = await getRemainingQuota(conference.id);

            await insertRegistrant({
                conferenceId: conference.id,
                displayName: "E2E Usage-and-Quotas Test Registrant 1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingRegistrants).toBe(remainingQuotaPreInsert.remainingRegistrants - 1);
        });

        it("goes up by one when a registrant is deleted", async () => {
            await updateQuota(conference.id, {
                maxRegistrants: 1,
            });

            const registrant = await insertRegistrant({
                conferenceId: conference.id,
                displayName: "E2E Usage-and-Quotas Test Registrant 1",
            });

            const remainingQuotaPreDelete = await getRemainingQuota(conference.id);
            await deleteRegistrant(registrant.id);

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingRegistrants).toBe(remainingQuotaPreDelete.remainingRegistrants + 1);
        });
    });

    describe("remainingVideoChatNonEventTotalMinutes", () => {
        it("initially matches the default quota", () => {
            expect(initialRemainingQuota.remainingVideoChatNonEventTotalMinutes).toBe(
                initialQuota.maxVideoChatNonEventTotalMinutesConsumed
            );
        });

        it("matches the quota minus usage (positive)", async () => {
            const quotaMinutes = 100;
            const usageMinutes = 10;
            await updateQuota(conference.id, {
                maxVideoChatNonEventTotalMinutesConsumed: quotaMinutes,
            });
            await updateUsage(conference.id, {
                consumedVideoChatNonEventTotalMinutes: usageMinutes,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingVideoChatNonEventTotalMinutes).toBe(quotaMinutes - usageMinutes);
        });

        it("matches the quota minus usage (negative)", async () => {
            const quotaMinutes = 100;
            const usageMinutes = 110;
            await updateQuota(conference.id, {
                maxVideoChatNonEventTotalMinutesConsumed: quotaMinutes,
            });
            await updateUsage(conference.id, {
                consumedVideoChatNonEventTotalMinutes: usageMinutes,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingVideoChatNonEventTotalMinutes).toBe(quotaMinutes - usageMinutes);
        });

        it("increases when the quota is increased", async () => {
            const change = 10;
            await updateQuota(conference.id, {
                maxVideoChatNonEventTotalMinutesConsumed:
                    initialQuota.maxVideoChatNonEventTotalMinutesConsumed + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingVideoChatNonEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatNonEventTotalMinutes + change
            );
        });

        it("decreases when the quota is decreased", async () => {
            const change = -10;
            await updateQuota(conference.id, {
                maxVideoChatNonEventTotalMinutesConsumed:
                    initialQuota.maxVideoChatNonEventTotalMinutesConsumed + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingVideoChatNonEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatNonEventTotalMinutes + change
            );
        });

        it("increases when the usage is decreased", async () => {
            const change = -10;
            await updateUsage(conference.id, {
                consumedVideoChatNonEventTotalMinutes: initialUsage.consumedVideoChatNonEventTotalMinutes + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingVideoChatNonEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatNonEventTotalMinutes - change
            );
        });

        it("decreases when the usage is increased", async () => {
            const change = 10;
            await updateUsage(conference.id, {
                consumedVideoChatNonEventTotalMinutes: initialUsage.consumedVideoChatNonEventTotalMinutes + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingVideoChatNonEventTotalMinutes).toBe(
                initialRemainingQuota.remainingVideoChatNonEventTotalMinutes - change
            );
        });
    });

    describe("remainingSupportMeetingMinutes", () => {
        it("initially matches the default quota", () => {
            expect(initialRemainingQuota.remainingSupportMeetingMinutes).toBe(initialQuota.maxSupportMeetingMinutes);
        });

        it("matches the quota minus usage (positive)", async () => {
            const quotaMinutes = 100;
            const usageMinutes = 10;
            await updateQuota(conference.id, {
                maxSupportMeetingMinutes: quotaMinutes,
            });
            await updateUsage(conference.id, {
                consumedSupportMeetingMinutes: usageMinutes,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSupportMeetingMinutes).toBe(quotaMinutes - usageMinutes);
        });

        it("matches the quota minus usage (negative)", async () => {
            const quotaMinutes = 100;
            const usageMinutes = 110;
            await updateQuota(conference.id, {
                maxSupportMeetingMinutes: quotaMinutes,
            });
            await updateUsage(conference.id, {
                consumedSupportMeetingMinutes: usageMinutes,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSupportMeetingMinutes).toBe(quotaMinutes - usageMinutes);
        });

        it("increases when the quota is increased", async () => {
            const change = 10;
            await updateQuota(conference.id, {
                maxSupportMeetingMinutes: initialQuota.maxSupportMeetingMinutes + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSupportMeetingMinutes).toBe(
                initialRemainingQuota.remainingSupportMeetingMinutes + change
            );
        });

        it("decreases when the quota is decreased", async () => {
            initialQuota = await updateQuota(conference.id, {
                maxSupportMeetingMinutes: 100,
            });
            initialRemainingQuota = await getRemainingQuota(conference.id);
            const change = -10;
            await updateQuota(conference.id, {
                maxSupportMeetingMinutes: initialQuota.maxSupportMeetingMinutes + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSupportMeetingMinutes).toBe(
                initialRemainingQuota.remainingSupportMeetingMinutes + change
            );
        });

        it("increases when the usage is decreased", async () => {
            const change = -10;
            await updateUsage(conference.id, {
                consumedSupportMeetingMinutes: initialUsage.consumedSupportMeetingMinutes + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSupportMeetingMinutes).toBe(
                initialRemainingQuota.remainingSupportMeetingMinutes - change
            );
        });

        it("decreases when the usage is increased", async () => {
            const change = 10;
            await updateUsage(conference.id, {
                consumedSupportMeetingMinutes: initialUsage.consumedSupportMeetingMinutes + change,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingSupportMeetingMinutes).toBe(
                initialRemainingQuota.remainingSupportMeetingMinutes - change
            );
        });
    });

    describe("remainingItems", () => {
        it("initially matches the default quota", () => {
            expect(initialRemainingQuota.remainingContentItems).toBe(initialQuota.maxContentItems);
        });

        it("matches the quota when quota is non-zero", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingContentItems).toBe(1);
        });

        it("matches the expected remaining quota (1 quota / 1 usage / 0 remaining)", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });
            await insertItem({
                conferenceId: conference.id,
                title: "e2e-test-usage-and-quotas-item-1",
                typeName: Content_ItemType_Enum.Other,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingContentItems).toBe(0);
        });

        it("matches the expected remaining quota (2 quota / 1 usage / 1 remaining)", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 2,
            });
            await insertItem({
                conferenceId: conference.id,
                title: "e2e-test-usage-and-quotas-item-1",
                typeName: Content_ItemType_Enum.Other,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingContentItems).toBe(1);
        });

        it("matches the expected remaining quota (2 quota / 2 usage / 0 remaining)", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 2,
            });

            await insertItem({
                conferenceId: conference.id,
                title: "e2e-test-usage-and-quotas-item-1",
                typeName: Content_ItemType_Enum.Other,
            });
            await insertItem({
                conferenceId: conference.id,
                title: "e2e-test-usage-and-quotas-item-2",
                typeName: Content_ItemType_Enum.Other,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingContentItems).toBe(0);
        });

        it("goes down by one when a item is inserted", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });
            const remainingQuotaPreInsert = await getRemainingQuota(conference.id);

            await insertItem({
                conferenceId: conference.id,
                title: "e2e-test-usage-and-quotas-item-1",
                typeName: Content_ItemType_Enum.Other,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingContentItems).toBe(remainingQuotaPreInsert.remainingContentItems - 1);
        });

        it("goes up by one when a item is deleted", async () => {
            await updateQuota(conference.id, {
                maxContentItems: 1,
            });

            const item = await insertItem({
                conferenceId: conference.id,
                title: "e2e-test-usage-and-quotas-item-1",
                typeName: Content_ItemType_Enum.Other,
            });

            const remainingQuotaPreDelete = await getRemainingQuota(conference.id);
            await deleteItem(item.id);

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingContentItems).toBe(remainingQuotaPreDelete.remainingContentItems + 1);
        });
    });
});

describe("RemainingQuota - Room quotas", () => {
    let conference: TestConferenceFragment;
    let initialQuota: QuotaFragment;
    let initialUsage: UsageFragment;
    let initialRemainingQuota: RemainingQuotaFragment;

    beforeEach(async () => {
        await cleanupTestConference();

        conference = (await createTestConference())?.data?.insert_conference_Conference_one;
        expect(conference).toBeDefined();

        initialQuota = await getQuota(conference.id);
        initialUsage = await getUsage(conference.id);
        initialRemainingQuota = await getRemainingQuota(conference.id);

        expect(initialQuota).toBeDefined();
        expect(initialUsage).toBeDefined();
        expect(initialRemainingQuota).toBeDefined();
    });
    afterEach(cleanupTestConference);

    describe("remainingStreamingProgramRooms", () => {
        it("equals quota when no rooms exist", () => {
            expect(initialRemainingQuota.remainingStreamingProgramRooms).toBe(initialQuota.maxStreamingProgramRooms);
        });

        it("equals quota when no rooms exist and quota is non-zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(1);
        });

        it("equals quota when rooms exist but no streaming events", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(1);
        });

        it("equals quota minus count of rooms with streaming events", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(1);
        });

        it("increases when quota is increased", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(2);

            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 3,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(3);
        });

        it("decreases when quota is decreased", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 3,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(3);

            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(2);
        });

        it("decreases when room with streaming event is inserted", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(1);
        });

        it("increases when room with a single streaming event is deleted", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            const event = await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quotaPreDelete = await getRemainingQuota(conference.id);
            expect(quotaPreDelete.remainingStreamingProgramRooms).toBe(1);

            await deleteEvent(event.id);

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(2);
        });

        it("does not change when non-streaming event is inserted in a room", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Video-Chat Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(2);
        });

        it("does not change when non-streaming event is deleted from a room", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Video-Chat Room 1",
            });

            const event = await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(2);

            await deleteEvent(event.id);

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingStreamingProgramRooms).toBe(2);
        });
    });

    describe("remainingNonStreamingProgramRooms", () => {
        it("equals quota when no rooms exist", () => {
            expect(initialRemainingQuota.remainingNonStreamingProgramRooms).toBe(
                initialQuota.maxNonStreamingProgramRooms
            );
        });

        it("equals quota when no rooms exist and quota is non-zero", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 1,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(1);
        });

        it("equals quota when rooms exist but no non-streaming events", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 1,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Non-Streaming Room 1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(1);
        });

        it("equals quota minus count of rooms with non-streaming events", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Non-Streaming Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(1);
        });

        it("increases when quota is increased", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(2);

            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 3,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(3);
        });

        it("decreases when quota is decreased", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 3,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(3);

            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(2);
        });

        it("decreases when room with non-streaming event is inserted", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Non-Streaming Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(1);
        });

        it("increases when room with a single non-streaming event is deleted", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Non-Streaming Room 1",
            });

            const event = await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quotaPreDelete = await getRemainingQuota(conference.id);
            expect(quotaPreDelete.remainingNonStreamingProgramRooms).toBe(1);

            await deleteEvent(event.id);

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(2);
        });

        it("does not change when streaming event is inserted in a room", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(2);
        });

        it("does not change when streaming event is deleted from a room", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            const event = await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(2);

            await deleteEvent(event.id);

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingNonStreamingProgramRooms).toBe(2);
        });
    });

    describe("remainingPublicSocialRooms", () => {
        it("equals quota when no rooms exist", () => {
            expect(initialRemainingQuota.remainingPublicSocialRooms).toBe(initialQuota.maxPublicSocialRooms);
        });

        it("equals quota when no rooms exist and quota is non-zero", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 1,
            });
            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(1);
        });

        it("equals quota when public rooms exist but with events", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 1,
                maxNonStreamingProgramRooms: 1,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Non-Streaming Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(1);
        });

        it("equals quota minus count of public rooms with no events", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 1,
                maxNonStreamingProgramRooms: 1,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Non-Streaming Room 1",
            });
            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Public Social Room 1",
            });

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(0);
        });

        it("increases when quota is increased", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);

            await updateQuota(conference.id, {
                maxPublicSocialRooms: 3,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(3);
        });

        it("decreases when quota is decreased", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 3,
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(3);

            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("decreases when public room with no events is inserted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Public Social Room 1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(1);
        });

        it("increases when public room with no events is deleted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Public Social Room 1",
            });

            const quotaPreDelete = await getRemainingQuota(conference.id);
            expect(quotaPreDelete.remainingPublicSocialRooms).toBe(1);

            await deleteRoom(room.id);

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("does not change when a DM room is inserted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Dm,
                name: "E2E Usage-and-Quotas Test DM Room 1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("does not change when a DM room is deleted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Dm,
                name: "E2E Usage-and-Quotas Test DM Room 1",
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);

            await deleteRoom(room.id);

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("does not change when a private room is inserted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Private,
                name: "E2E Usage-and-Quotas Test Private Room 1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("does not change when a Private room is deleted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Private,
                name: "E2E Usage-and-Quotas Test Private Room 1",
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);

            await deleteRoom(room.id);

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("does not change when a managed room is inserted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Managed,
                name: "E2E Usage-and-Quotas Test Managed Room 1",
            });

            const quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("does not change when a Managed room is deleted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Managed,
                name: "E2E Usage-and-Quotas Test Managed Room 1",
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);

            await deleteRoom(room.id);

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("increases when room without events has an event inserted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(1);

            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);
        });

        it("decreases when room with events has all events deleted", async () => {
            await updateQuota(conference.id, {
                maxPublicSocialRooms: 2,
            });

            const room = await insertRoom({
                conferenceId: conference.id,
                capacity: 50,
                managementModeName: Room_ManagementMode_Enum.Public,
                name: "E2E Usage-and-Quotas Test Streaming Room 1",
            });

            let quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(1);

            const event = await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(2);

            await deleteEvent(event.id);

            quota = await getRemainingQuota(conference.id);
            expect(quota.remainingPublicSocialRooms).toBe(1);
        });
    });
});
