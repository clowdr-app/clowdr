import { gql } from "@apollo/client/core";
import assert from "assert";
import { MediaLive } from "../aws/awsClient";
import {
    CreateMediaLiveChannelDocument,
    DeleteMediaLiveChannelDocument,
    GetMediaLiveChannelByRoomDocument,
    GetRoomsWithEventsStartingDocument,
    GetRoomsWithNoEventsStartingDocument,
    SetMediaLiveChannelForRoomDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createDistribution } from "../lib/aws/cloudFront";
import {
    ChannelState,
    createChannel as createMediaLiveChannel,
    createMP4Input,
    createRtmpInput,
    getMediaLiveChannelState,
} from "../lib/aws/mediaLive";
import { createChannel as createMediaPackageChannel, createOriginEndpoint } from "../lib/aws/mediaPackage";

gql`
    query GetRoomsWithEventsStarting($from: timestamptz, $to: timestamptz) {
        Room(where: { events: { startTime: { _gte: $from, _lte: $to } } }) {
            id
            mediaLiveChannel {
                id
                mediaLiveChannelId
            }
            presenterVonageSessionId
        }
    }

    mutation DeleteMediaLiveChannel($id: uuid!) {
        delete_MediaLiveChannel_by_pk(id: $id) {
            id
        }
    }
`;

export async function ensureUpcomingChannelsCreated(): Promise<void> {
    console.log("Ensuring channels created for rooms with upcoming events");
    const now = new Date();
    const from = now.toISOString();
    const to = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const roomsResult = await apolloClient.query({
        query: GetRoomsWithEventsStartingDocument,
        variables: {
            from,
            to,
        },
    });

    if (roomsResult.error || roomsResult.errors) {
        console.error("Failure while retrieving rooms with upcoming events", roomsResult.error, roomsResult.errors);
    }

    if (roomsResult.data.Room.length === 0) {
        console.log("No rooms have events starting soon");
    }

    console.log(`Found ${roomsResult.data.Room.length} rooms with upcoming events`);

    for (const room of roomsResult.data.Room) {
        console.log("Syncing channel for room", room.id);
        let needToCreateChannel = false;
        if (room.mediaLiveChannel) {
            const channelState = await getMediaLiveChannelState(room.mediaLiveChannel.mediaLiveChannelId);
            if (
                [
                    ChannelState.CREATE_FAILED,
                    ChannelState.DELETED,
                    ChannelState.DELETING,
                    ChannelState.UPDATE_FAILED,
                    "MISSING",
                ].includes(channelState)
            ) {
                console.log("Removing old/broken channel from room", room.id, room.mediaLiveChannel.id, channelState);
                await apolloClient.mutate({
                    mutation: DeleteMediaLiveChannelDocument,
                    variables: {
                        id: room.mediaLiveChannel.id,
                    },
                });

                needToCreateChannel = true;
            }

            if ([ChannelState.IDLE.toString(), ChannelState.STOPPING].includes(channelState)) {
                console.log(
                    "Starting stopped channel",
                    room.id,
                    room.mediaLiveChannel.mediaLiveChannelId,
                    channelState
                );
                await MediaLive.startChannel({
                    ChannelId: room.mediaLiveChannel.mediaLiveChannelId,
                });
            }

            if (channelState === ChannelState.RUNNING) {
                console.log("Channel is already running", room.id, room.mediaLiveChannel.mediaLiveChannelId);
            }

            if (
                [ChannelState.STARTING.toString(), ChannelState.CREATING, ChannelState.UPDATING].includes(channelState)
            ) {
                console.log(
                    "Channel is still starting",
                    room.id,
                    room.mediaLiveChannel.mediaLiveChannelId,
                    channelState
                );
            }

            if (channelState === ChannelState.RECOVERING) {
                console.log("Channel is recovering", room.id, room.mediaLiveChannel.mediaLiveChannelId);
            }
        }

        if (needToCreateChannel || !room.mediaLiveChannel) {
            console.log("Creating new MediaLive channel for room", room.id);
            await createNewChannelForRoom(room.id);
        }
    }
}

gql`
    query GetRoomsWithNoEventsStarting($from: timestamptz, $to: timestamptz) {
        Room(where: { _not: { events: { startTime: { _gte: $from, _lte: $to } } } }) {
            id
            mediaLiveChannel {
                id
                mediaLiveChannelId
            }
            presenterVonageSessionId
        }
    }
`;

export async function stopChannelsWithoutUpcomingOrCurrentEvents(): Promise<void> {
    console.log("Stopping channels with no recent or upcoming events");
    // WARNING: this is hardcoded to check for events that started up to two hours ago.
    // TODO: make this more robust for long events
    const now = new Date();
    const from = new Date(now.getTime() - 120 * 60 * 1000).toISOString();
    const to = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

    const roomsResult = await apolloClient.query({
        query: GetRoomsWithNoEventsStartingDocument,
        variables: {
            from,
            to,
        },
    });

    if (roomsResult.error || roomsResult.errors) {
        console.error(
            "Failure while retrieving rooms without upcoming or ongoing events",
            roomsResult.error,
            roomsResult.errors
        );
        return;
    }

    if (roomsResult.data.Room.length === 0) {
        console.log("No rooms without upcoming or ongoing events");
    }

    console.log(`Found ${roomsResult.data.Room.length} rooms without upcoming or ongoing events`);

    for (const room of roomsResult.data.Room) {
        console.log("Ensuring channel for room is stopped", room.id);
        if (room.mediaLiveChannel) {
            const channelState = await getMediaLiveChannelState(room.mediaLiveChannel.mediaLiveChannelId);

            if (channelState === ChannelState.RUNNING) {
                console.log("Stopping running channel", room.id, room.mediaLiveChannel.mediaLiveChannelId);
                await MediaLive.stopChannel({
                    ChannelId: room.mediaLiveChannel.mediaLiveChannelId,
                });
            }
        }
    }

    // TODO: delete channels that are no longer required
}

gql`
    mutation CreateMediaLiveChannel(
        $cloudFrontDistributionId: String!
        $mediaLiveChannelId: String!
        $mediaPackageChannelId: String = ""
        $mp4InputId: String = ""
        $rtmpInputId: String!
        $rtmpInputUri: String!
        $endpointUri: String!
        $cloudFrontDomain: String!
    ) {
        insert_MediaLiveChannel_one(
            object: {
                cloudFrontDistributionId: $cloudFrontDistributionId
                mediaLiveChannelId: $mediaLiveChannelId
                mediaPackageChannelId: $mediaPackageChannelId
                mp4InputId: $mp4InputId
                rtmpInputId: $rtmpInputId
                rtmpInputUri: $rtmpInputUri
                endpointUri: $endpointUri
                cloudFrontDomain: $cloudFrontDomain
            }
        ) {
            id
        }
    }

    mutation SetMediaLiveChannelForRoom($roomId: uuid!, $mediaLiveChannelId: uuid!) {
        update_Room_by_pk(pk_columns: { id: $roomId }, _set: { mediaLiveChannelId: $mediaLiveChannelId }) {
            id
        }
    }
`;

async function createNewChannelForRoom(roomId: string): Promise<void> {
    assert(
        process.env.AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID,
        "AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID environment variable must be defined"
    );
    const rtmpInput = await createRtmpInput(roomId, process.env.AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID);
    const mp4InputId = await createMP4Input(roomId, process.env.AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID);

    const mediaPackageChannelId = await createMediaPackageChannel(roomId);
    const originEndpoint = await createOriginEndpoint(roomId, mediaPackageChannelId);

    const mediaLiveChannelId = await createMediaLiveChannel(roomId, rtmpInput.id, mp4InputId, mediaPackageChannelId);
    const cloudFrontDistribution = await createDistribution(roomId, originEndpoint);

    const result = await apolloClient.mutate({
        mutation: CreateMediaLiveChannelDocument,
        variables: {
            cloudFrontDistributionId: cloudFrontDistribution.id,
            cloudFrontDomain: cloudFrontDistribution.domain,
            endpointUri: originEndpoint.endpointUri,
            mediaLiveChannelId: mediaLiveChannelId,
            rtmpInputId: rtmpInput.id,
            rtmpInputUri: rtmpInput.rtmpUri,
            mediaPackageChannelId: mediaPackageChannelId,
            mp4InputId: mp4InputId,
        },
    });

    if (result.errors) {
        console.error(
            "Failure while saving details of new MediaLive channel",
            mediaLiveChannelId,
            roomId,
            result.errors
        );
        throw new Error("Failure while saving details of new MediaLive channel");
    }

    const updateResult = await apolloClient.mutate({
        mutation: SetMediaLiveChannelForRoomDocument,
        variables: {
            roomId,
            mediaLiveChannelId: result.data?.insert_MediaLiveChannel_one?.id,
        },
    });

    if (updateResult.errors) {
        console.error(
            "Failure while storing new MediaLive channel against room",
            result.data?.insert_MediaLiveChannel_one?.id,
            roomId,
            result.errors
        );
    }
}

async function syncChannelSchedules(): Promise<void> {
    // todo
}

gql`
    query GetMediaLiveChannelByRoom($roomId: uuid!) {
        Room_by_pk(id: $roomId) {
            id
            mediaLiveChannel {
                mediaLiveChannelId
            }
        }
    }
`;

gql`
    query GetTransitionsByRoom($roomId: uuid!) {
        Transitions(where: { roomId: { _eq: $roomId } }) {
            broadcastContentItem {
                input
                inputTypeName
            }
            time
        }
    }
`;

async function syncChannelSchedule(roomId: string): Promise<void> {
    const result = await apolloClient.query({
        query: GetMediaLiveChannelByRoomDocument,
        variables: {
            roomId,
        },
    });

    if (!result.data.Room_by_pk?.mediaLiveChannel?.mediaLiveChannelId) {
        console.warn("No MediaLive channel details found for room. Skipping schedule sync.", roomId);
        return;
    }

    const channelId = result.data.Room_by_pk.mediaLiveChannel.mediaLiveChannelId;

    // assume that any outdated transitions have been removed from the schedule
    // TODO: listen to transition changes/deletes and purge the old versions from the schedule

    // get existing schedule for the channel, find any missing switches, insert them
    const existingSchedule = await MediaLive.describeSchedule({
        ChannelId: channelId,
    });

    const transitions = await MediaLive.batchUpdateSchedule({
        // todo
        ChannelId: result.data.Room_by_pk.mediaLiveChannel.mediaLiveChannelId,
        Creates: {
            ScheduleActions: [],
        },
    });
}
