import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    RoomFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { Room_ManagementMode_Enum, Schedule_Mode_Enum } from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { insertEvent, updateEvent } from "../../src/lib/event";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { insertRoom } from "../../src/lib/room";
import { getUsage } from "../../src/lib/usage";
import expectError from "../expectError";

describe("checkInsertEvent", () => {
    let conference: TestConferenceFragment;
    let initialQuota: QuotaFragment;
    let initialUsage: UsageFragment;
    let initialRemainingQuota: RemainingQuotaFragment;
    let streamingRoom1: RoomFragment;
    let streamingRoom2: RoomFragment;
    let videoChatRoom1: RoomFragment;
    let videoChatRoom2: RoomFragment;

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
            maxStreamingProgramRooms: 2,
            maxNonStreamingProgramRooms: 2,

            areStreamingEventsAllowed: true,
            maxStreamingEventTotalMinutes: 100,
            maxStreamingEventIndividualMinutes: 100,

            areVideoChatEventsAllowed: true,
            maxVideoChatEventTotalMinutes: 100,
            maxVideoChatEventIndividualMinutes: 100,
        });

        streamingRoom1 = await insertRoom({
            conferenceId: conference.id,
            capacity: 50,
            managementModeName: Room_ManagementMode_Enum.Public,
            name: "E2E Usage-and-Quotas Test Streaming Room 1",
        });
        streamingRoom2 = await insertRoom({
            conferenceId: conference.id,
            capacity: 50,
            managementModeName: Room_ManagementMode_Enum.Public,
            name: "E2E Usage-and-Quotas Test Streaming Room 2",
        });
        videoChatRoom1 = await insertRoom({
            conferenceId: conference.id,
            capacity: 50,
            managementModeName: Room_ManagementMode_Enum.Public,
            name: "E2E Usage-and-Quotas Test Video-Chat Room 1",
        });
        videoChatRoom2 = await insertRoom({
            conferenceId: conference.id,
            capacity: 50,
            managementModeName: Room_ManagementMode_Enum.Public,
            name: "E2E Usage-and-Quotas Test Video-Chat Room 2",
        });

        expect(streamingRoom1).toBeDefined();
        expect(streamingRoom2).toBeDefined();
        expect(videoChatRoom1).toBeDefined();
        expect(videoChatRoom2).toBeDefined();
    });
    afterEach(async () => {
        if (conference) {
            await cleanupTestConference(conference.id);
        }
    });

    it("permits change if room, start time, duration and mode are unchanged", async () => {
        const event = await insertEvent({
            conferenceId: conference.id,
            scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
            modeName: Schedule_Mode_Enum.Livestream,
            name: "E2E Usage-and-Quotas Test Event 1",
            roomId: streamingRoom1.id,
        });
        await insertEvent({
            conferenceId: conference.id,
            scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
            scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
            modeName: Schedule_Mode_Enum.Livestream,
            name: "E2E Usage-and-Quotas Test Event 2",
            roomId: streamingRoom2.id,
        });
        await updateEvent(event.id, {
            automaticParticipationSurvey: true,
        });
    });

    describe("new mode is streaming", () => {
        describe("when old mode is not streaming", () => {
            it("prevents update if streaming events are not allowed", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: videoChatRoom1.id,
                });
                await updateQuota(conference.id, {
                    areStreamingEventsAllowed: false,
                });
                await expectError(
                    "Quota limit reached (streaming events not included)",
                    updateEvent(event.id, {
                        modeName: Schedule_Mode_Enum.Livestream,
                    })
                );
            });
        });

        describe("when old mode is not streaming or Room has changed", () => {
            it("prevents update if target room is a non-streaming room", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Room is a non-streaming program room.",
                    updateEvent(event.id, {
                        roomId: videoChatRoom2.id,
                        modeName: Schedule_Mode_Enum.Livestream,
                    })
                );
            });

            it("prevents update if target room is not a program room and no remaining quota for streaming rooms", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 26 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 3",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (streaming program rooms)",
                    updateEvent(event.id, {
                        roomId: videoChatRoom2.id,
                        modeName: Schedule_Mode_Enum.Livestream,
                    })
                );
            });
        });

        describe("always", () => {
            it("prevents update if event duration exceeds individual event quota", async () => {
                const scheduledStartTime = new Date(Date.now() + 25 * 60 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: streamingRoom1.id,
                });
                await expectError(
                    "Quota limit reached (streaming event duration)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(scheduledStartTime.getTime() + 110 * 60 * 1000),
                    })
                );
            });

            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() + 25 * 60 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(scheduledStartTime.getTime() + 60 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 18 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledEndTime: new Date(Date.now() + 18 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    scheduledStartTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(Date.now() + 18 * 60 * 60 * 1000 + 100 * 60 * 1000),
                        scheduledStartTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future-to-past scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 18 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 18 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future-to-ongoing scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                });
            });

            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledEndTime: new Date(scheduledStartTime.getTime() + 90 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() + 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-ongoing scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-ongoing scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    })
                );
            });

            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() - 10 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledEndTime: new Date(scheduledStartTime.getTime() + 60 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() - 10 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(scheduledStartTime.getTime() + 70 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 15 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 15 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 59 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() - 4 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() - 4 * 60 * 1000 + 59 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 60 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 50 - 5 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 50 - 5 * 60 * 1000 + 55 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 60 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() - 5 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() - 5 * 60 * 1000 + 57 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() + 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000 + 49.9 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 60 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total streaming event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() + 60 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing-to-past scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
        });
    });

    describe("new mode is video-chat", () => {
        describe("when old mode is not video-chat", () => {
            it("prevents update if video-chat events are not allowed", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: streamingRoom1.id,
                });
                await updateQuota(conference.id, {
                    areVideoChatEventsAllowed: false,
                });
                await expectError(
                    "Quota limit reached (video-chat events not included)",
                    updateEvent(event.id, {
                        modeName: Schedule_Mode_Enum.VideoChat,
                    })
                );
            });
        });

        describe("when old mode is not video-chat or Room has changed", () => {
            it("prevents update if target room is a streaming room", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Room is a streaming program room.",
                    updateEvent(event.id, {
                        roomId: streamingRoom2.id,
                        modeName: Schedule_Mode_Enum.VideoChat,
                    })
                );
            });

            it("prevents update if target room is not a program room and no remaining quota for video-chat rooms", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 26 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 3",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (non-streaming program rooms)",
                    updateEvent(event.id, {
                        roomId: streamingRoom2.id,
                        modeName: Schedule_Mode_Enum.VideoChat,
                    })
                );
            });
        });

        describe("always", () => {
            it("prevents update if event duration exceeds individual event quota", async () => {
                const scheduledStartTime = new Date(Date.now() + 25 * 60 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: videoChatRoom1.id,
                });
                await expectError(
                    "Quota limit reached (video-chat event duration)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(scheduledStartTime.getTime() + 110 * 60 * 1000),
                    })
                );
            });

            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() + 25 * 60 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(scheduledStartTime.getTime() + 60 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 18 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledEndTime: new Date(Date.now() + 18 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    scheduledStartTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(Date.now() + 18 * 60 * 60 * 1000 + 100 * 60 * 1000),
                        scheduledStartTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future-to-past scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 18 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 18 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [future-to-ongoing scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                });
            });

            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledEndTime: new Date(scheduledStartTime.getTime() + 90 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() + 20 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-ongoing scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [past-to-ongoing scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 25 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 100 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    })
                );
            });

            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() - 10 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledEndTime: new Date(scheduledStartTime.getTime() + 60 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, duration-change scenario]", async () => {
                const scheduledStartTime = new Date(Date.now() - 10 * 60 * 1000);
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime,
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledEndTime: new Date(scheduledStartTime.getTime() + 70 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 15 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 15 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, start-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 59 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() - 4 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() - 4 * 60 * 1000 + 59 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 60 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 50 - 5 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 50 - 5 * 60 * 1000 + 55 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing, both-change scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 60 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() - 5 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() - 5 * 60 * 1000 + 57 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() + 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000 + 49.9 * 60 * 1000),
                });
            });
            it("prevents update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing-to-future scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 60 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (total video-chat event minutes)",
                    updateEvent(event.id, {
                        scheduledStartTime: new Date(Date.now() + 60 * 60 * 1000),
                        scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000 + 60 * 60 * 1000),
                    })
                );
            });
            it("permits update if ((old event duration or remaining time) + remaining quota) < (new event duration or remaining time) [ongoing-to-past scenario]", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() - 10 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 10 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
                await updateEvent(event.id, {
                    scheduledStartTime: new Date(Date.now() - 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() - 60 * 60 * 1000 + 50 * 60 * 1000),
                });
            });
        });
    });

    describe("new mode is non-streaming, non-video-chat", () => {
        describe("when old mode is not video-chat or Room has changed", () => {
            it("prevents update if target room is a streaming room", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom2.id,
                });
                await expectError(
                    "Room is a streaming program room.",
                    updateEvent(event.id, {
                        roomId: streamingRoom2.id,
                        modeName: Schedule_Mode_Enum.Exhibition,
                    })
                );
            });

            it("prevents update if target room is not a program room and no remaining quota for video-chat rooms", async () => {
                const event = await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.Livestream,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 25 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    scheduledStartTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
                    scheduledEndTime: new Date(Date.now() + 26 * 60 * 60 * 1000 + 10 * 60 * 1000),
                    modeName: Schedule_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 3",
                    roomId: videoChatRoom2.id,
                });
                await expectError(
                    "Quota limit reached (non-streaming program rooms)",
                    updateEvent(event.id, {
                        roomId: streamingRoom2.id,
                        modeName: Schedule_Mode_Enum.Exhibition,
                    })
                );
            });
        });
    });
});
