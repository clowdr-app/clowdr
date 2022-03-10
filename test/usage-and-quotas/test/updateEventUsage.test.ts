import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    RoomFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../src/generated/graphql";
import { Room_ManagementMode_Enum, Room_Mode_Enum } from "../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../src/lib/conference";
import { insertEvent } from "../src/lib/event";
import { getQuota } from "../src/lib/quota";
import { getRemainingQuota } from "../src/lib/remainingQuota";
import { insertRoom } from "../src/lib/room";
import { callUpdateUsage, getUsage, updateUsage } from "../src/lib/usage";
import expectWithinRange from "./expectWithinRange";

describe("checkInsertRoom", () => {
    let conference: TestConferenceFragment;
    let initialQuota: QuotaFragment;
    let initialUsage: UsageFragment;
    let initialRemainingQuota: RemainingQuotaFragment;
    let room: RoomFragment;
    const now = new Date(Date.now() - 10 * 60 * 1000);

    beforeEach(async () => {
        conference = (await createTestConference())?.data?.insert_conference_Conference_one;
        expect(conference).toBeDefined();

        initialQuota = await getQuota(conference.id);
        initialUsage = await getUsage(conference.id);
        initialRemainingQuota = await getRemainingQuota(conference.id);

        expect(initialQuota).toBeDefined();
        expect(initialUsage).toBeDefined();
        expect(initialRemainingQuota).toBeDefined();

        room = await insertRoom({
            conferenceId: conference.id,
            capacity: 50,
            managementModeName: Room_ManagementMode_Enum.Public,
            name: "Test Room",
        });

        await updateUsage(conference.id, {
            consumedStreamingEventTotalMinutes: 0,
            consumedVideoChatEventTotalMinutes: 0,
            consumedVideoChatNonEventTotalMinutes: 0,
            consumedSupportMeetingMinutes: 0,
            lastUpdatedConsumedStreamingEventTotalMinutes: now,
            lastUpdatedConsumedVideoChatEventTotalMinutes: now,
            lastUpdatedConsumedVideoChatNonEventTotalMinutes: now,
            lastUpdatedConsumedSupportMeetingMinutes: now,
        });
    });
    afterEach(async () => {
        if (conference) {
            await cleanupTestConference(conference.id);
        }
    });

    describe("future events", () => {
        it("live-streaming consumption remains unchanged", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("video-chat consumption remains unchanged", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });
    });

    describe("ongoing events", () => {
        it("live-streaming consumption increases accurately", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: now.toISOString(),
                durationSeconds: 20 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes + Math.round((updateTime - now.getTime()) / (60 * 1000))
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("video-chat consumption increases accurately", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: now.toISOString(),
                durationSeconds: 20 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes + Math.round((updateTime - now.getTime()) / (60 * 1000))
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("streaming and video-chat consumption remains unchanged", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: now.toISOString(),
                durationSeconds: 20 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });
    });

    describe("past events", () => {
        it("live-streaming consumption increases accurately", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
                durationSeconds: 5 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes +
                    Math.round((updateTime - now.getTime() - 5 * 60 * 1000) / (60 * 1000))
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("video-chat consumption increases accurately", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
                durationSeconds: 5 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes +
                    Math.round((updateTime - now.getTime() - 5 * 60 * 1000) / (60 * 1000))
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("streaming and video-chat consumption remains unchanged", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
                durationSeconds: 5 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("live-streaming consumption increases accurately and ignores older events", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes +
                    Math.round((updateTime - now.getTime() - 5 * 60 * 1000) / (60 * 1000))
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("video-chat consumption increases accurately and ignores older events", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes +
                    Math.round((updateTime - now.getTime() - 5 * 60 * 1000) / (60 * 1000))
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });

        it("streaming and video-chat consumption remains unchanged and ignores older events", async () => {
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: room.id,
            });

            const updateTime = Date.now();
            const updateTimeLowerBound = updateTime - 100;
            const updateTimeUpperBound = updateTime + 100;

            const unchangedTimeLowerBound = now.getTime() - 10;
            const unchangedTimeUpperBound = now.getTime() + 10;

            const usages = await callUpdateUsage();
            const updatedUsage = usages.find((x) => x.conferenceId === conference.id);

            expect(updatedUsage.consumedStreamingEventTotalMinutes).toBe(
                initialUsage.consumedStreamingEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatEventTotalMinutes
            );
            expect(updatedUsage.consumedVideoChatNonEventTotalMinutes).toBe(
                initialUsage.consumedVideoChatNonEventTotalMinutes
            );
            expect(updatedUsage.consumedSupportMeetingMinutes).toBe(initialUsage.consumedSupportMeetingMinutes);

            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedStreamingEventTotalMinutes)
            );
            expectWithinRange(
                updateTimeLowerBound,
                updateTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedVideoChatNonEventTotalMinutes)
            );
            expectWithinRange(
                unchangedTimeLowerBound,
                unchangedTimeUpperBound,
                Date.parse(updatedUsage.lastUpdatedConsumedSupportMeetingMinutes)
            );
        });
    });
});
