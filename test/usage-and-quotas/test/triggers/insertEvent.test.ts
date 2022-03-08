import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type {
    QuotaFragment,
    RemainingQuotaFragment,
    RoomFragment,
    TestConferenceFragment,
    UsageFragment,
} from "../../src/generated/graphql";
import { Room_ManagementMode_Enum, Room_Mode_Enum } from "../../src/generated/graphql";
import { cleanupTestConference, createTestConference } from "../../src/lib/conference";
import { insertEvent } from "../../src/lib/event";
import { getQuota, updateQuota } from "../../src/lib/quota";
import { getRemainingQuota } from "../../src/lib/remainingQuota";
import { insertRoom } from "../../src/lib/room";
import { getUsage } from "../../src/lib/usage";
import extractActualError from "./extractError";

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

    describe("streaming events", () => {
        it.fails("prevents insert if streaming events are not allowed", async () => {
            await updateQuota(conference.id, {
                areStreamingEventsAllowed: false,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });
        });
        it("prevents insert if streaming events are not allowed - error message check", async () => {
            await updateQuota(conference.id, {
                areStreamingEventsAllowed: false,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: streamingRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (streaming events not included)");
        });

        it("permits insert if streaming events are allowed (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });
        });

        it.fails(
            "prevents insert if the event duration is greater than the individual event duration quota (and other quotas are met)",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,
                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 100,
                    maxStreamingEventIndividualMinutes: 5,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: streamingRoom1.id,
                });
            }
        );
        it("prevents insert if the event duration is greater than the individual event duration quota (and other quotas are met) - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 5,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: streamingRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (streaming event duration)");
        });

        it("permits insert if the event duration is equal to the individual event duration quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 10,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });
        });

        it("permits insert if the event duration is less than the individual event duration quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });
        });

        it.fails(
            "prevents insert if the event duration is greater than the remaining events-total quota (and other quotas are met)",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,
                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 5,
                    maxStreamingEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: streamingRoom1.id,
                });
            }
        );
        it("prevents insert if the event duration is greater than the remaining events-total quota (and other quotas are met) - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 5,
                maxStreamingEventIndividualMinutes: 100,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: streamingRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (total streaming event minutes)");
        });

        it("permits insert if the event duration is equal to the remaining events-total quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 10,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });
        });

        it("permits insert if the event duration is less than the remaining events-total quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: streamingRoom1.id,
            });
        });

        it.fails(
            "prevents insert if the target room contains a non-streaming event (and other quotas are met)",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,

                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 100,
                    maxStreamingEventIndividualMinutes: 100,

                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 100,
                    maxVideoChatEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom1.id,
                });
            }
        );
        it("prevents insert if the target room contains a non-streaming event (and other quotas are met) - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Room is a non-streaming program room.");
        });

        it("permits insert if the target room contains only streaming events (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: streamingRoom1.id,
            });
        });

        it("permits insert if the target room contains no events (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
        });

        it.fails("prevents insert if the room is not already a program room and remaining quota is zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
        });
        it("prevents insert if the room is not already a program room and remaining quota is zero - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (streaming program rooms)");
        });

        it.fails(
            "prevents insert if the room is not already a program room and remaining quota is less than zero",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,
                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 100,
                    maxStreamingEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 0,
                    maxNonStreamingProgramRooms: 1,
                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 100,
                    maxStreamingEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom2.id,
                });
            }
        );
        it("prevents insert if the room is not already a program room and remaining quota is less than zero - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom2.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (streaming program rooms)");
        });

        it("permits insert if the room is not already a program room and remaining quota is greater than zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 2,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom2.id,
            });
        });

        it("permits insert if the room is already a program room and remaining quota is less than zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 0,
                maxNonStreamingProgramRooms: 1,
                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: streamingRoom1.id,
            });
        });
    });

    describe("video-chat events", () => {
        it.fails("prevents insert if video-chat events are not allowed", async () => {
            await updateQuota(conference.id, {
                areVideoChatEventsAllowed: false,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });
        });
        it("prevents insert if video-chat events are not allowed - error message check", async () => {
            await updateQuota(conference.id, {
                areVideoChatEventsAllowed: false,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: videoChatRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (video-chat events not included)");
        });

        it("permits insert if video-chat events are allowed (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });
        });

        it.fails(
            "prevents insert if the event duration is greater than the individual event duration quota (and other quotas are met)",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,
                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 100,
                    maxVideoChatEventIndividualMinutes: 5,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: videoChatRoom1.id,
                });
            }
        );
        it("prevents insert if the event duration is greater than the individual event duration quota (and other quotas are met) - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 5,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: videoChatRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (video-chat event duration)");
        });

        it("permits insert if the event duration is equal to the individual event duration quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 10,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });
        });

        it("permits insert if the event duration is less than the individual event duration quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });
        });

        it.fails(
            "prevents insert if the event duration is greater than the remaining events-total quota (and other quotas are met)",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,
                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 5,
                    maxVideoChatEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: videoChatRoom1.id,
                });
            }
        );
        it("prevents insert if the event duration is greater than the remaining events-total quota (and other quotas are met) - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 5,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event",
                    roomId: videoChatRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (total video-chat event minutes)");
        });

        it("permits insert if the event duration is equal to the remaining events-total quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 10,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });
        });

        it("permits insert if the event duration is less than the remaining events-total quota (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event",
                roomId: videoChatRoom1.id,
            });
        });

        it.fails(
            "prevents insert if the target room contains a streaming event (and other quotas are met)",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,

                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 100,
                    maxStreamingEventIndividualMinutes: 100,

                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 100,
                    maxVideoChatEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom1.id,
                });
            }
        );
        it("prevents insert if the target room contains a streaming event (and other quotas are met) - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Room is a streaming program room.");
        });

        it("permits insert if the target room contains only non-streaming events (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: videoChatRoom1.id,
            });
        });

        it("permits insert if the target room contains no events (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 2,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: videoChatRoom2.id,
            });
        });

        it.fails("prevents insert if the room is not already a program room and remaining quota is zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: videoChatRoom2.id,
            });
        });
        it("prevents insert if the room is not already a program room and remaining quota is zero - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (non-streaming program rooms)");
        });

        it.fails(
            "prevents insert if the room is not already a program room and remaining quota is less than zero",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,
                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 100,
                    maxVideoChatEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 0,
                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 100,
                    maxVideoChatEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.VideoChat,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: videoChatRoom2.id,
                });
            }
        );

        it("permits insert if the room is not already a program room and remaining quota is greater than zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 2,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: videoChatRoom2.id,
            });
        });

        it("permits insert if the room is already a program room and remaining quota is less than zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 0,
                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: videoChatRoom1.id,
            });
        });
    });

    describe("other events", () => {
        it.fails(
            "prevents insert if the target room contains a streaming event (and other quotas are met)",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,

                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 100,
                    maxStreamingEventIndividualMinutes: 100,

                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 100,
                    maxVideoChatEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: streamingRoom1.id,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom1.id,
                });
            }
        );
        it("prevents insert if the target room contains a streaming event (and other quotas are met) - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Prerecorded,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: streamingRoom1.id,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event 2",
                    roomId: streamingRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Room is a streaming program room.");
        });

        it("permits insert if the target room contains only non-streaming events (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.None,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 26 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event 2",
                roomId: videoChatRoom1.id,
            });
        });

        it("permits insert if the target room contains no events (and other quotas are met)", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
        });

        it.fails("prevents insert if the room is not already a program room and remaining quota is zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 0,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
        });
        it("prevents insert if the room is not already a program room and remaining quota is zero - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 0,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (non-streaming program rooms)");
        });

        it.fails(
            "prevents insert if the room is not already a program room and remaining quota is less than zero",
            async () => {
                await updateQuota(conference.id, {
                    maxStreamingProgramRooms: 1,
                    maxNonStreamingProgramRooms: 1,

                    areStreamingEventsAllowed: true,
                    maxStreamingEventTotalMinutes: 100,
                    maxStreamingEventIndividualMinutes: 100,

                    areVideoChatEventsAllowed: true,
                    maxVideoChatEventTotalMinutes: 100,
                    maxVideoChatEventIndividualMinutes: 100,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom1.id,
                });
                await updateQuota(conference.id, {
                    maxNonStreamingProgramRooms: 0,
                });
                await insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom2.id,
                });
            }
        );
        it("prevents insert if the room is not already a program room and remaining quota is less than zero - error message check", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 1,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 0,
            });
            await expect(
                insertEvent({
                    conferenceId: conference.id,
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    durationSeconds: 10 * 60,
                    intendedRoomModeName: Room_Mode_Enum.Exhibition,
                    name: "E2E Usage-and-Quotas Test Event 1",
                    roomId: videoChatRoom2.id,
                }).catch((err) => {
                    throw extractActualError(err);
                })
            ).rejects.toThrowError("Quota limit reached (non-streaming program rooms)");
        });

        it("permits insert if the room is not already a program room and remaining quota is greater than zero", async () => {
            await updateQuota(conference.id, {
                maxStreamingProgramRooms: 1,
                maxNonStreamingProgramRooms: 2,

                areStreamingEventsAllowed: true,
                maxStreamingEventTotalMinutes: 100,
                maxStreamingEventIndividualMinutes: 100,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 100,
                maxVideoChatEventIndividualMinutes: 100,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 10 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
        });

        it("permits insert event when remaining video-chat quota is less than zero", async () => {
            await updateQuota(conference.id, {
                maxNonStreamingProgramRooms: 2,

                areVideoChatEventsAllowed: true,
                maxVideoChatEventTotalMinutes: 20,
                maxVideoChatEventIndividualMinutes: 20,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
                durationSeconds: 20 * 60,
                intendedRoomModeName: Room_Mode_Enum.VideoChat,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
            await updateQuota(conference.id, {
                maxVideoChatEventTotalMinutes: 10,
                maxVideoChatEventIndividualMinutes: 10,
            });
            await insertEvent({
                conferenceId: conference.id,
                startTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
                durationSeconds: 100 * 60,
                intendedRoomModeName: Room_Mode_Enum.Exhibition,
                name: "E2E Usage-and-Quotas Test Event 1",
                roomId: videoChatRoom1.id,
            });
        });
    });
});
