import { gql } from "@apollo/client/core";
import { FollowPoint, ScheduleAction } from "@aws-sdk/client-medialive";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import R from "ramda";
import { MediaLive, shortId } from "../aws/awsClient";
import {
    CreateMediaLiveChannelDocument,
    DeleteMediaLiveChannelDocument,
    GetConferenceIdFromChannelResourceIdDocument,
    GetConfigurationValueDocument,
    GetMediaLiveChannelByRoomDocument,
    GetRoomsWithEventsDocument,
    GetRoomsWithEventsStartingDocument,
    GetRoomsWithNoEventsStartingDocument,
    GetTransitionsByRoomDocument,
    InputType_Enum,
    SetMediaLiveChannelForRoomDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { createDistribution } from "../lib/aws/cloudFront";
import {
    ChannelState,
    createChannel as createMediaLiveChannel,
    createLoopingMP4Input,
    createMP4Input,
    createRtmpInput,
    getMediaLiveChannelState,
} from "../lib/aws/mediaLive";
import { createChannel as createMediaPackageChannel, createOriginEndpoint } from "../lib/aws/mediaPackage";

gql`
    query GetRoomsWithEventsStarting($from: timestamptz, $to: timestamptz) {
        Room(
            where: {
                events: {
                    startTime: { _gte: $from, _lte: $to }
                    intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                }
            }
        ) {
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
        $mediaPackageChannelId: String!
        $mp4InputId: String!
        $rtmpInputId: String!
        $rtmpInputUri: String!
        $endpointUri: String!
        $cloudFrontDomain: String!
        $mp4InputAttachmentName: String!
        $loopingMp4InputAttachmentName: String!
        $vonageInputAttachmentName: String!
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
                mp4InputAttachmentName: $mp4InputAttachmentName
                loopingMp4InputAttachmentName: $loopingMp4InputAttachmentName
                vonageInputAttachmentName: $vonageInputAttachmentName
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
    const loopingMp4InputId = await createLoopingMP4Input(roomId, process.env.AWS_MEDIALIVE_INPUT_SECURITY_GROUP_ID);

    const mediaPackageChannelId = await createMediaPackageChannel(roomId);
    const originEndpoint = await createOriginEndpoint(roomId, mediaPackageChannelId);

    const mediaLiveChannel = await createMediaLiveChannel(
        roomId,
        rtmpInput.id,
        mp4InputId,
        loopingMp4InputId,
        mediaPackageChannelId
    );
    const cloudFrontDistribution = await createDistribution(roomId, originEndpoint);

    const result = await apolloClient.mutate({
        mutation: CreateMediaLiveChannelDocument,
        variables: {
            cloudFrontDistributionId: cloudFrontDistribution.id,
            cloudFrontDomain: cloudFrontDistribution.domain,
            endpointUri: originEndpoint.endpointUri,
            mediaLiveChannelId: mediaLiveChannel.channelId,
            rtmpInputId: rtmpInput.id,
            rtmpInputUri: rtmpInput.rtmpUri,
            mediaPackageChannelId: mediaPackageChannelId,
            mp4InputId: mp4InputId,
            mp4InputAttachmentName: mediaLiveChannel.mp4InputAttachmentName,
            loopingMp4InputAttachmentName: mediaLiveChannel.loopingMp4InputAttachmentName,
            vonageInputAttachmentName: mediaLiveChannel.vonageInputAttachmentName,
        },
    });

    if (result.errors) {
        console.error(
            "Failure while saving details of new MediaLive channel",
            mediaLiveChannel.channelId,
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

gql`
    query GetRoomsWithEvents {
        Room(where: { events: { intendedRoomModeName: { _in: [Q_AND_A, PRERECORDED, PRESENTATION] } } }) {
            id
        }
    }
`;

export async function syncChannelSchedules(): Promise<void> {
    // TODO: only look at future/current events?
    const rooms = await apolloClient.query({
        query: GetRoomsWithEventsDocument,
    });

    if (rooms.error || rooms.errors) {
        console.error("Could not get rooms with events to sync channel schedules", rooms.error, rooms.errors);
    }

    for (const room of rooms.data.Room) {
        try {
            await syncChannelSchedule(room.id);
        } catch (e) {
            console.error("Failure while syncing channel schedule", room.id, e);
            continue;
        }
    }
}

gql`
    query GetMediaLiveChannelByRoom($roomId: uuid!) {
        Room_by_pk(id: $roomId) {
            id
            conferenceId
            mediaLiveChannel {
                id
                mediaLiveChannelId
                mp4InputAttachmentName
                vonageInputAttachmentName
                loopingMp4InputAttachmentName
            }
        }
    }
`;

gql`
    query GetTransitionsByRoom($roomId: uuid!) {
        Transitions(where: { roomId: { _eq: $roomId } }) {
            broadcastContentItem {
                id
                input
                inputTypeName
            }
            id
            time
        }
    }
`;

interface ComparableScheduleAction {
    name: string;
    mp4Key?: string;
    inputAttachmentNameSuffix: string;
    timeMillis: number;
    invalid?: boolean;
}

export async function syncChannelSchedule(roomId: string): Promise<void> {
    console.log("Attempting to sync channel schedule", roomId);
    const channelResult = await apolloClient.query({
        query: GetMediaLiveChannelByRoomDocument,
        variables: {
            roomId,
        },
    });

    if (!channelResult.data.Room_by_pk?.mediaLiveChannel?.mediaLiveChannelId) {
        console.warn("No MediaLive channel details found for room. Skipping schedule sync.", roomId);
        return;
    }

    const channel = channelResult.data.Room_by_pk.mediaLiveChannel;

    const mediaLiveChannel = await MediaLive.describeChannel({
        ChannelId: channel.mediaLiveChannelId,
    });

    if (mediaLiveChannel.State !== "IDLE" && mediaLiveChannel.State !== "RUNNING") {
        console.warn("Cannot sync channel schedule", roomId, channel.id, mediaLiveChannel.State);
        return;
    }

    const allTransitionsResult = await apolloClient.query({
        query: GetTransitionsByRoomDocument,
        variables: {
            roomId,
        },
    });

    if (allTransitionsResult.error || allTransitionsResult.errors) {
        console.error("Error while retrieving transitions for room. Skipping schedule sync.", roomId);
        return;
    }

    // Generate a simplified representation of what the channel schedule 'ought' to be
    const transitions = allTransitionsResult.data.Transitions;
    const fillerVideoKey = await getFillerVideo(channelResult.data.Room_by_pk?.conferenceId);
    const expectedSchedule = R.flatten(
        transitions.map((transition) => {
            const input: BroadcastContentItemInput = transition.broadcastContentItem.input;
            if (input.type === "MP4Input") {
                const { key } = new AmazonS3URI(input.s3Url);

                if (!key) {
                    return [];
                }

                const prepareAction: ComparableScheduleAction = {
                    name: `${transition.id}-prepare`,
                    mp4Key: key,
                    inputAttachmentNameSuffix: "mp4",
                    timeMillis: Date.parse(transition.time) - 30000,
                };

                const switchAction: ComparableScheduleAction = {
                    name: `${transition.id}`,
                    mp4Key: key,
                    inputAttachmentNameSuffix: "mp4",
                    timeMillis: Date.parse(transition.time),
                };

                return [prepareAction, switchAction];
            } else if (input.type === "VonageInput") {
                return [
                    {
                        name: `${transition.id}`,
                        inputAttachmentNameSuffix: "vonage",
                        timeMillis: Date.parse(transition.time),
                    },
                ];
            } else {
                return [];
            }
        })
    );

    // Generate a simplified version of what the channel schedule 'actually' is
    const existingSchedule = await MediaLive.describeSchedule({
        ChannelId: channel.mediaLiveChannelId,
    });

    const actualSchedule =
        existingSchedule.ScheduleActions?.map((action) => {
            if (!action.ActionName) {
                return null;
            }
            if (!action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings) {
                return null;
            }
            if (action.ScheduleActionSettings?.InputPrepareSettings) {
                const result: ComparableScheduleAction = {
                    inputAttachmentNameSuffix: "mp4",
                    name: action.ActionName,
                    mp4Key:
                        action.ScheduleActionSettings.InputPrepareSettings.UrlPath?.length === 1
                            ? action.ScheduleActionSettings.InputPrepareSettings.UrlPath[0]
                            : "",
                    timeMillis: Date.parse(
                        action.ScheduleActionStartSettings.FixedModeScheduleActionStartSettings.Time ??
                            "1970-01-01T00:00:00+0000"
                    ),
                };
                return result;
            } else if (action.ScheduleActionSettings?.InputSwitchSettings) {
                if (
                    action.ScheduleActionSettings.InputSwitchSettings.InputAttachmentNameReference?.endsWith("-vonage")
                ) {
                    const result: ComparableScheduleAction = {
                        inputAttachmentNameSuffix: "vonage",
                        name: action.ActionName,
                        timeMillis: Date.parse(
                            action.ScheduleActionStartSettings.FixedModeScheduleActionStartSettings.Time ??
                                "1970-01-01T00:00:00+0000"
                        ),
                    };
                    return result;
                } else if (
                    action.ScheduleActionSettings.InputSwitchSettings.InputAttachmentNameReference?.endsWith("mp4")
                ) {
                    const result: ComparableScheduleAction = {
                        inputAttachmentNameSuffix: "mp4",
                        name: action.ActionName,
                        mp4Key:
                            action.ScheduleActionSettings.InputSwitchSettings.UrlPath?.length === 1
                                ? action.ScheduleActionSettings.InputSwitchSettings.UrlPath[0]
                                : "",
                        timeMillis: Date.parse(
                            action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings?.Time ??
                                "1970-01-01T00:00:00+0000"
                        ),
                    };
                    return result;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }).filter(notEmpty) ?? [];

    // Identify schedule actions that are not mean to be there and delete them
    const unexpectedScheduleItems = R.without(expectedSchedule, actualSchedule);

    console.log(
        `Removing ${unexpectedScheduleItems.length} expired items from channel schedule`,
        roomId,
        channel.mediaLiveChannelId
    );
    await MediaLive.batchUpdateSchedule({
        ChannelId: channel.mediaLiveChannelId,
        Deletes: {
            ActionNames: unexpectedScheduleItems.map((item) => item.name),
        },
    });

    // Go through each transition and create any missing schedule actions
    console.log("Refetching updated channel schedule", roomId, channel.mediaLiveChannelId);
    const trimmedSchedule = await MediaLive.describeSchedule({
        ChannelId: channel.mediaLiveChannelId,
    });

    const trimmedScheduleActionNames =
        trimmedSchedule.ScheduleActions?.map((action) => action.ActionName).filter(notEmpty) ?? [];

    const earliestInsertionTime = new Date().getTime() + 30000;

    console.log("Generating list of new schedule actions", roomId, channel.mediaLiveChannelId);
    const newScheduleActions: ScheduleAction[] = [];
    for (const transition of allTransitionsResult.data.Transitions) {
        // Don't try to insert transitions in the next 30s (AWS limit: 15s after present)
        if (Date.parse(transition.time) < earliestInsertionTime) {
            continue;
        }

        const input: BroadcastContentItemInput = transition.broadcastContentItem.input;
        if (transition.broadcastContentItem.inputTypeName === InputType_Enum.Mp4 && input.type === "MP4Input") {
            let urlPath;
            try {
                const { key } = new AmazonS3URI(input.s3Url);
                urlPath = key;
            } catch (e) {
                console.error("Invalid S3 uri on transition", input.s3Url, transition.id, roomId);
                continue;
            }
            if (!trimmedScheduleActionNames.includes(`${transition.id}`) && urlPath) {
                newScheduleActions.push({
                    ActionName: `${transition.id}`,
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference: channel.mp4InputAttachmentName,
                            UrlPath: [urlPath],
                        },
                    },
                    ScheduleActionStartSettings: {
                        FixedModeScheduleActionStartSettings: {
                            Time: new Date(Date.parse(transition.time)).toISOString(),
                        },
                    },
                });

                newScheduleActions.push({
                    ActionName: `${transition.id}-follow`,
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference: channel.loopingMp4InputAttachmentName,
                            UrlPath: [fillerVideoKey],
                        },
                    },
                    ScheduleActionStartSettings: {
                        FollowModeScheduleActionStartSettings: {
                            FollowPoint: FollowPoint.END,
                            ReferenceActionName: `${transition.id}`,
                        },
                    },
                });
            }

            if (!trimmedScheduleActionNames.includes(`${transition.id}-prepare`) && urlPath) {
                newScheduleActions.push({
                    ActionName: `${transition.id}-prepare`,
                    ScheduleActionSettings: {
                        InputPrepareSettings: {
                            InputAttachmentNameReference: channel.mp4InputAttachmentName,
                            UrlPath: [urlPath],
                        },
                    },
                    ScheduleActionStartSettings: {
                        FixedModeScheduleActionStartSettings: {
                            Time: new Date(Date.parse(transition.time) - 30000).toISOString(),
                        },
                    },
                });
            }
        } else if (
            transition.broadcastContentItem.inputTypeName === InputType_Enum.VonageSession &&
            input.type === "VonageInput"
        ) {
            if (!trimmedScheduleActionNames.includes(`${transition.id}`)) {
                newScheduleActions.push({
                    ActionName: `${transition.id}`,
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference: channel.vonageInputAttachmentName,
                        },
                    },
                    ScheduleActionStartSettings: {
                        FixedModeScheduleActionStartSettings: {
                            Time: new Date(Date.parse(transition.time)).toISOString(),
                        },
                    },
                });
            }
        }
    }
    console.log(
        `Generated ${newScheduleActions.length} new schedule actions for channel`,
        roomId,
        channel.mediaLiveChannelId
    );

    console.log("Updating channel schedule", roomId, channel.mediaLiveChannelId);
    await MediaLive.batchUpdateSchedule({
        // todo
        ChannelId: channel.mediaLiveChannelId,
        Creates: {
            ScheduleActions: newScheduleActions,
        },
    });
}

export async function switchToFillerVideo(channelResourceId: string): Promise<void> {
    console.log("Switching to filler video", channelResourceId);

    // Figure out which conference this MediaLive channel belongs to
    gql`
        query GetConferenceIdFromChannelResourceId($channelResourceId: String!) {
            MediaLiveChannel(where: { mediaLiveChannelId: { _eq: $channelResourceId } }) {
                id
                room {
                    id
                    conferenceId
                }
            }
        }
    `;

    const conferenceIdResult = await apolloClient.query({
        query: GetConferenceIdFromChannelResourceIdDocument,
        variables: {
            channelResourceId,
        },
    });

    if (conferenceIdResult.error || conferenceIdResult.errors) {
        console.error(
            "Error while retrieving conference ID for MediaLive channel resource",
            channelResourceId,
            conferenceIdResult.error,
            conferenceIdResult.errors
        );
        return;
    }

    if (conferenceIdResult.data.MediaLiveChannel.length !== 1 || !conferenceIdResult.data.MediaLiveChannel[0].room) {
        console.error(
            "Expected exactly one conference to be associated with MediaLive channel resource",
            channelResourceId
        );
        return;
    }

    const conferenceId = conferenceIdResult.data.MediaLiveChannel[0].room.conferenceId;

    const fillerVideoKey = await getFillerVideo(conferenceId);

    // Determine which input is the looping one
    const channelDescription = await MediaLive.describeChannel({
        ChannelId: channelResourceId,
    });

    const loopingAttachmentName = channelDescription.InputAttachments?.find((attachment) =>
        attachment.InputAttachmentName?.endsWith("-looping")
    )?.InputAttachmentName;

    if (!loopingAttachmentName) {
        console.error(
            "Could not find the looping attachment on the MediaLive channel.",
            channelResourceId,
            channelDescription.InputAttachments
        );
        return;
    }

    await MediaLive.batchUpdateSchedule({
        ChannelId: channelResourceId,
        Creates: {
            ScheduleActions: [
                {
                    ActionName: `${shortId()}-fallback`,
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference: loopingAttachmentName,
                            UrlPath: [fillerVideoKey],
                        },
                    },
                    ScheduleActionStartSettings: {
                        ImmediateModeScheduleActionStartSettings: {},
                    },
                },
            ],
        },
    });
}

async function getFillerVideo(conferenceId: string): Promise<string> {
    // Find the filler video to be played
    const fillerVideosResult = await apolloClient.query({
        query: GetConfigurationValueDocument,
        variables: {
            conferenceId: conferenceId,
            key: "FILLER_VIDEOS",
        },
    });

    if (fillerVideosResult.error || fillerVideosResult.errors) {
        console.error("Error while retrieving filler videos for conference", conferenceId);
        throw new Error("Error while retrieving filler videos for conference");
    }

    if (fillerVideosResult.data.ConferenceConfiguration.length === 0) {
        console.log("No filler videos found for conference", conferenceId);
        throw new Error("No filler videos found for conference");
    }

    // Set the dynamic path for the MP4 MediaLive input
    let urlPath;
    try {
        const { key } = new AmazonS3URI(fillerVideosResult.data.ConferenceConfiguration[0].value[0]);
        urlPath = key;
    } catch (e) {
        console.error(
            "Error parsing filler video URI",
            conferenceId,
            fillerVideosResult.data.ConferenceConfiguration[0].value,
            e
        );
    }

    if (!urlPath) {
        console.error("Could not parse filler video URI", conferenceId, urlPath);
        throw new Error("Could not parse filler video URI");
    }

    return urlPath;
}

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}
