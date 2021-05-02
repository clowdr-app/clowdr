import { gql } from "@apollo/client/core";
import AmazonS3URI from "amazon-s3-uri";
import { GetConferenceIdFromChannelResourceIdDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { MediaLive, shortId } from "./aws/awsClient";
import { getConferenceConfiguration } from "./conferenceConfiguration";

// gql`
//     query GetRoomsWithEventsStarting($from: timestamptz, $to: timestamptz) {
//         Room(
//             where: {
//                 events: {
//                     startTime: { _gte: $from, _lte: $to }
//                     intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
//                 }
//             }
//         ) {
//             id
//             conferenceId
//             mediaLiveChannel {
//                 id
//                 mediaLiveChannelId
//             }
//         }
//     }

//     mutation DetachMediaLiveChannel($id: uuid!) {
//         update_MediaLiveChannel_by_pk(pk_columns: { id: $id }, _set: { roomId: null }) {
//             id
//         }
//     }
// `;

// export async function ensureUpcomingChannelsStarted(holdOffOnStartingChannel: {
//     [roomId: string]: boolean;
// }): Promise<void> {
//     console.log("Ensuring channels created for rooms with upcoming events");
//     const now = new Date();
//     const from = now.toISOString();
//     const to = addMinutes(now, 30).toISOString();

//     let roomsResult: ApolloQueryResult<GetRoomsWithEventsStartingQuery>;
//     try {
//         roomsResult = await callWithRetry(() =>
//             apolloClient.query({
//                 query: GetRoomsWithEventsStartingDocument,
//                 variables: {
//                     from,
//                     to,
//                 },
//             })
//         );
//     } catch (e) {
//         console.error("Failure while retrieving rooms with upcoming events", e);
//         throw new Error("Failure while retrieving rooms with upcoming events");
//     }

//     console.log(`Found ${roomsResult.data.Room.length} rooms with upcoming events`);

//     for (const room of roomsResult.data.Room) {
//         console.log("Syncing channel for room", { roomId: room.id });

//         if (holdOffOnStartingChannel[room.id]) {
//             console.warn("Channel sync has requested a hold on restarting the channel", { roomId: room.id });
//             continue;
//         }

//         if (room.mediaLiveChannel) {
//             const channelState = await getMediaLiveChannelState(room.mediaLiveChannel.mediaLiveChannelId);
//             console.log("Checked channel state", {
//                 roomId: room.id,
//                 mediaLiveChannelId: room.mediaLiveChannel.mediaLiveChannelId,
//                 channelState,
//             });
//             if (
//                 [
//                     ChannelState.CREATE_FAILED,
//                     ChannelState.DELETED,
//                     ChannelState.DELETING,
//                     ChannelState.UPDATE_FAILED,
//                     "MISSING",
//                 ].includes(channelState)
//             ) {
//                 console.log("Detaching broken channel stack from room", {
//                     roomId: room.id,
//                     mediaLiveChannelId: room.mediaLiveChannel.id,
//                     channelState,
//                 });
//                 try {
//                     await apolloClient.mutate({
//                         mutation: DetachMediaLiveChannelDocument,
//                         variables: {
//                             id: room.mediaLiveChannel.id,
//                         },
//                     });
//                 } catch (e) {
//                     console.error("Failed to delete MediaLive channel record", e, {
//                         mediaLiveChannelId: room.mediaLiveChannel.id,
//                     });
//                 }
//             }

//             if ([ChannelState.IDLE.toString(), ChannelState.STOPPING].includes(channelState)) {
//                 console.log("Starting stopped channel", {
//                     roomId: room.id,
//                     mediaLiveChannelId: room.mediaLiveChannel.mediaLiveChannelId,
//                     channelState,
//                 });
//                 await MediaLive.startChannel({
//                     ChannelId: room.mediaLiveChannel.mediaLiveChannelId,
//                 });
//             }

//             if (channelState === ChannelState.RUNNING) {
//                 console.log("Channel is already running", {
//                     roomId: room.id,
//                     mediaLiveChannelId: room.mediaLiveChannel.mediaLiveChannelId,
//                 });
//             }

//             if (
//                 [ChannelState.STARTING.toString(), ChannelState.CREATING, ChannelState.UPDATING].includes(channelState)
//             ) {
//                 console.log("Channel is still starting", {
//                     roomId: room.id,
//                     mediaLiveChannelId: room.mediaLiveChannel.mediaLiveChannelId,
//                     channelState,
//                 });
//             }

//             if (channelState === ChannelState.RECOVERING) {
//                 console.log("Channel is recovering", {
//                     roomId: room.id,
//                     mediaLiveChannelId: room.mediaLiveChannel.mediaLiveChannelId,
//                 });
//             }
//         } else {
//             console.log("No channel stack available for room yet, skipping sync", { roomId: room.id });
//         }
//     }
// }

// gql`
//     query GetRoomsWithNoEvents($from: timestamptz, $to: timestamptz) {
//         Room(
//             where: {
//                 _not: {
//                     _or: [
//                         { events: { startTime: { _gte: $from, _lte: $to } } }
//                         { events: { startTime: { _lte: $from }, endTime: { _gte: $from } } }
//                         { _not: { mediaLiveChannel: {} } }
//                     ]
//                 }
//             }
//         ) {
//             id
//             mediaLiveChannel {
//                 id
//                 mediaLiveChannelId
//             }
//         }
//     }
// `;

// export async function stopChannelsWithoutUpcomingOrCurrentEvents(): Promise<void> {
//     console.log("Stopping channels with no recent or upcoming events");
//     // TODO: perhaps this should look at transitions as well as events?
//     const now = new Date();
//     const from = now.toISOString();
//     const to = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

//     const roomsResult = await apolloClient.query({
//         query: GetRoomsWithNoEventsDocument,
//         variables: {
//             from,
//             to,
//         },
//     });

//     if (roomsResult.error || roomsResult.errors) {
//         console.error(
//             "Failure while retrieving rooms without upcoming or ongoing events",
//             roomsResult.error,
//             roomsResult.errors
//         );
//         return;
//     }

//     if (roomsResult.data.Room.length === 0) {
//         console.log("No rooms without upcoming or ongoing events");
//     }

//     console.log(`Found ${roomsResult.data.Room.length} rooms without upcoming or ongoing events`);

//     for (const room of roomsResult.data.Room) {
//         if (room.mediaLiveChannel) {
//             console.log("Ensuring channel for room is stopped", room.id);
//             const channelState = await getMediaLiveChannelState(room.mediaLiveChannel.mediaLiveChannelId);

//             if (channelState === ChannelState.RUNNING) {
//                 console.log("Stopping running channel", room.id, room.mediaLiveChannel.mediaLiveChannelId);
//                 await MediaLive.stopChannel({
//                     ChannelId: room.mediaLiveChannel.mediaLiveChannelId,
//                 });
//             }
//         }
//     }
// }

// gql`
//     query GetRoomsWithEvents($now: timestamptz!) {
//         Room(
//             where: {
//                 events: { intendedRoomModeName: { _in: [Q_AND_A, PRERECORDED, PRESENTATION] }, endTime: { _gte: $now } }
//                 mediaLiveChannel: {}
//             }
//         ) {
//             id
//         }
//     }
// `;

// export async function syncChannelSchedules(): Promise<{ [roomId: string]: boolean }> {
//     console.log("Syncing room schedules to channels");
//     // TODO: only look at future/current events?

//     let rooms: ApolloQueryResult<GetRoomsWithEventsQuery>;
//     try {
//         rooms = await apolloClient.query({
//             query: GetRoomsWithEventsDocument,
//             variables: {
//                 now: new Date().toISOString(),
//             },
//         });
//     } catch (e) {
//         console.error("Could not get rooms with events to sync channel schedules", e);
//         return {};
//     }

//     console.log(`Found ${rooms.data.Room.length} rooms for channel sync`);

//     const holdOffOnCreatingChannel: { [roomId: string]: boolean } = {};
//     for (const room of rooms.data.Room) {
//         try {
//             holdOffOnCreatingChannel[room.id] = await syncChannelSchedule(room.id);
//         } catch (e) {
//             console.error("Failure while syncing channel schedule", room.id, e);
//             continue;
//         }
//     }

//     return holdOffOnCreatingChannel;
// }

// gql`
//     query GetMediaLiveChannelByRoom($roomId: uuid!) {
//         Room_by_pk(id: $roomId) {
//             id
//             conferenceId
//             mediaLiveChannel {
//                 id
//                 mediaLiveChannelId
//                 mp4InputAttachmentName
//                 vonageInputAttachmentName
//                 loopingMp4InputAttachmentName
//             }
//         }
//     }
// `;

// gql`
//     query GetTransitionsByRoom($roomId: uuid!) {
//         Transitions(where: { roomId: { _eq: $roomId } }) {
//             broadcastContentItem {
//                 id
//                 input
//                 inputTypeName
//             }
//             id
//             time
//         }
//     }
// `;

// interface ComparableScheduleAction {
//     name: string;
//     mp4Key?: string;
//     inputAttachmentNameSuffix: string;
//     timeMillis: number;
//     invalid?: boolean;
// }

// Return value: whether to hold off on recreating the channel
// export async function syncChannelSchedule(roomId: string): Promise<boolean> {
//     console.log("Attempting to sync channel schedule", { roomId });
//     const channelResult = await apolloClient.query({
//         query: GetMediaLiveChannelByRoomDocument,
//         variables: {
//             roomId,
//         },
//     });

//     if (!channelResult.data.Room_by_pk?.mediaLiveChannel?.mediaLiveChannelId) {
//         console.warn("No MediaLive channel details found for room. Skipping schedule sync.", { roomId });
//         return false;
//     }

//     const channel = channelResult.data.Room_by_pk.mediaLiveChannel;

//     const mediaLiveChannel = await MediaLive.describeChannel({
//         ChannelId: channel.mediaLiveChannelId,
//     });

//     if (mediaLiveChannel.State !== "IDLE" && mediaLiveChannel.State !== "RUNNING") {
//         console.warn("Cannot sync channel schedule", {
//             roomId,
//             mediaLiveChannelId: channel.id,
//             channelState: mediaLiveChannel.State,
//         });
//         return true;
//     }

//     const allTransitionsResult = await apolloClient.query({
//         query: GetTransitionsByRoomDocument,
//         variables: {
//             roomId,
//         },
//     });

//     if (allTransitionsResult.error || allTransitionsResult.errors) {
//         console.error("Error while retrieving transitions for room. Skipping schedule sync.", roomId);
//         return false;
//     }

//     // Generate a simplified representation of what the channel schedule 'ought' to be
//     const transitions = allTransitionsResult.data.Transitions;
//     let fillerVideoKey;
//     try {
//         fillerVideoKey = await getFillerVideos(channelResult.data.Room_by_pk?.conferenceId);
//     } catch (e) {
//         console.warn("Could not retrieve filler video", channelResult.data.Room_by_pk.conferenceId);
//     }
//     const expectedSchedule = R.flatten(
//         transitions.map((transition) => {
//             const input: BroadcastContentItemInput = transition.broadcastContentItem.input;
//             if (input.type === "MP4Input") {
//                 const { key } = new AmazonS3URI(input.s3Url);

//                 if (!key) {
//                     return [];
//                 }

//                 const switchAction: ComparableScheduleAction = {
//                     name: `${transition.id}`,
//                     mp4Key: key,
//                     inputAttachmentNameSuffix: "mp4",
//                     timeMillis: Date.parse(transition.time),
//                 };

//                 return [switchAction];
//             } else if (input.type === "VonageInput") {
//                 return [
//                     {
//                         name: `${transition.id}`,
//                         inputAttachmentNameSuffix: "rtmpA",
//                         timeMillis: Date.parse(transition.time),
//                     },
//                 ];
//             } else {
//                 return [];
//             }
//         })
//     );

//     // Generate a simplified version of what the channel schedule 'actually' is
//     const existingSchedule = await MediaLive.describeSchedule({
//         ChannelId: channel.mediaLiveChannelId,
//     });

//     const actualSchedule =
//         existingSchedule.ScheduleActions?.map((action) => {
//             if (!action.ActionName) {
//                 return null;
//             }
//             if (!action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings) {
//                 return null;
//             }
//             if (action.ScheduleActionSettings?.InputPrepareSettings) {
//                 const result: ComparableScheduleAction = {
//                     inputAttachmentNameSuffix: "mp4",
//                     name: action.ActionName,
//                     mp4Key:
//                         action.ScheduleActionSettings.InputPrepareSettings.UrlPath?.length === 1
//                             ? action.ScheduleActionSettings.InputPrepareSettings.UrlPath[0]
//                             : "",
//                     timeMillis: Date.parse(
//                         action.ScheduleActionStartSettings.FixedModeScheduleActionStartSettings.Time ??
//                             "1970-01-01T00:00:00+0000"
//                     ),
//                 };
//                 return result;
//             } else if (action.ScheduleActionSettings?.InputSwitchSettings) {
//                 if (
//                     action.ScheduleActionSettings.InputSwitchSettings.InputAttachmentNameReference?.endsWith("-rtmpA")
//                 ) {
//                     const result: ComparableScheduleAction = {
//                         inputAttachmentNameSuffix: "rtmpA",
//                         name: action.ActionName,
//                         timeMillis: Date.parse(
//                             action.ScheduleActionStartSettings.FixedModeScheduleActionStartSettings.Time ??
//                                 "1970-01-01T00:00:00+0000"
//                         ),
//                     };
//                     return result;
//                 } else if (
//                     action.ScheduleActionSettings.InputSwitchSettings.InputAttachmentNameReference?.endsWith("mp4")
//                 ) {
//                     const result: ComparableScheduleAction = {
//                         inputAttachmentNameSuffix: "mp4",
//                         name: action.ActionName,
//                         mp4Key:
//                             action.ScheduleActionSettings.InputSwitchSettings.UrlPath?.length === 1
//                                 ? action.ScheduleActionSettings.InputSwitchSettings.UrlPath[0]
//                                 : "",
//                         timeMillis: Date.parse(
//                             action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings?.Time ??
//                                 "1970-01-01T00:00:00+0000"
//                         ),
//                     };
//                     return result;
//                 } else {
//                     return null;
//                 }
//             } else {
//                 return null;
//             }
//         }).filter(notEmpty) ?? [];

//     // Identify schedule actions that are not mean to be there and delete them
//     const unexpectedScheduleItems = R.without(expectedSchedule, actualSchedule);

//     console.log(
//         `Removing ${unexpectedScheduleItems.length} expired items from channel schedule`,
//         roomId,
//         channel.mediaLiveChannelId
//     );
//     try {
//         const unexpectedFollowScheduleActions = existingSchedule.ScheduleActions?.filter(
//             (action) =>
//                 action.ScheduleActionStartSettings?.FollowModeScheduleActionStartSettings?.ReferenceActionName &&
//                 unexpectedScheduleItems.find(
//                     (item) =>
//                         item.name ===
//                         action.ScheduleActionStartSettings?.FollowModeScheduleActionStartSettings?.ReferenceActionName
//                 )
//         );
//         if (unexpectedFollowScheduleActions && unexpectedFollowScheduleActions.length > 0) {
//             await MediaLive.batchUpdateSchedule({
//                 ChannelId: channel.mediaLiveChannelId,
//                 Deletes: {
//                     ActionNames: unexpectedFollowScheduleActions?.map((item) => item.ActionName).filter(notEmpty),
//                 },
//             });
//         }

//         await MediaLive.batchUpdateSchedule({
//             ChannelId: channel.mediaLiveChannelId,
//             Deletes: {
//                 ActionNames: unexpectedScheduleItems.map((item) => item.name),
//             },
//         });
//     } catch (e) {
//         console.error(
//             "Error while deleting items from schedule. Attempting to stop the channel so that items can be deleted while it is idle.",
//             roomId,
//             channel.mediaLiveChannelId,
//             e
//         );
//         await MediaLive.stopChannel({
//             ChannelId: channel.mediaLiveChannelId,
//         });
//         return true;
//     }

//     // Go through each transition and create any missing schedule actions
//     console.log("Refetching updated channel schedule", roomId, channel.mediaLiveChannelId);
//     const trimmedSchedule = await MediaLive.describeSchedule({
//         ChannelId: channel.mediaLiveChannelId,
//     });

//     const trimmedScheduleActionNames =
//         trimmedSchedule.ScheduleActions?.map((action) => action.ActionName).filter(notEmpty) ?? [];

//     const earliestInsertionTime = new Date().getTime() + 30000;

//     console.log("Generating list of new schedule actions", roomId, channel.mediaLiveChannelId);
//     const newScheduleActions: ScheduleAction[] = [];
//     for (const transition of allTransitionsResult.data.Transitions) {
//         // Don't try to insert transitions in the next 30s (AWS limit: 15s after present)
//         if (Date.parse(transition.time) < earliestInsertionTime) {
//             continue;
//         }

//         const input: BroadcastContentItemInput = transition.broadcastContentItem.input;
//         if (transition.broadcastContentItem.inputTypeName === InputType_Enum.Mp4 && input.type === "MP4Input") {
//             let urlPath;
//             try {
//                 const { key } = new AmazonS3URI(input.s3Url);
//                 urlPath = key;
//             } catch (e) {
//                 console.error("Invalid S3 uri on transition", input.s3Url, transition.id, roomId);
//                 continue;
//             }
//             if (!trimmedScheduleActionNames.includes(`${transition.id}`) && urlPath) {
//                 newScheduleActions.push({
//                     ActionName: `${transition.id}`,
//                     ScheduleActionSettings: {
//                         InputSwitchSettings: {
//                             InputAttachmentNameReference: channel.mp4InputAttachmentName,
//                             UrlPath: [urlPath],
//                         },
//                     },
//                     ScheduleActionStartSettings: {
//                         FixedModeScheduleActionStartSettings: {
//                             Time: new Date(Date.parse(transition.time)).toISOString(),
//                         },
//                     },
//                 });

//                 if (fillerVideoKey) {
//                     newScheduleActions.push({
//                         ActionName: `${transition.id}-follow`,
//                         ScheduleActionSettings: {
//                             InputSwitchSettings: {
//                                 InputAttachmentNameReference: channel.loopingMp4InputAttachmentName,
//                                 UrlPath: [fillerVideoKey],
//                             },
//                         },
//                         ScheduleActionStartSettings: {
//                             FollowModeScheduleActionStartSettings: {
//                                 FollowPoint: FollowPoint.END,
//                                 ReferenceActionName: `${transition.id}`,
//                             },
//                         },
//                     });
//                 }
//             }
//         } else if (
//             transition.broadcastContentItem.inputTypeName === InputType_Enum.VonageSession &&
//             input.type === "VonageInput"
//         ) {
//             if (!trimmedScheduleActionNames.includes(`${transition.id}`)) {
//                 newScheduleActions.push({
//                     ActionName: `${transition.id}`,
//                     ScheduleActionSettings: {
//                         InputSwitchSettings: {
//                             InputAttachmentNameReference: channel.vonageInputAttachmentName,
//                         },
//                     },
//                     ScheduleActionStartSettings: {
//                         FixedModeScheduleActionStartSettings: {
//                             Time: new Date(Date.parse(transition.time)).toISOString(),
//                         },
//                     },
//                 });
//             }
//         }
//     }
//     console.log(
//         `Generated ${newScheduleActions.length} new schedule actions for channel`,
//         roomId,
//         channel.mediaLiveChannelId
//     );

//     console.log("Updating channel schedule", { roomId, mediaLiveChannelId: channel.mediaLiveChannelId });
//     await MediaLive.batchUpdateSchedule({
//         // todo
//         ChannelId: channel.mediaLiveChannelId,
//         Creates: {
//             ScheduleActions: newScheduleActions,
//         },
//     });

//     return false;
// }

export async function switchToFillerVideo(channelResourceId: string): Promise<void> {
    console.log("Switching to filler video", channelResourceId);

    // Figure out which conference this MediaLive channel belongs to
    gql`
        query GetConferenceIdFromChannelResourceId($channelResourceId: String!) {
            video_MediaLiveChannel(where: { mediaLiveChannelId: { _eq: $channelResourceId } }) {
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

    if (
        conferenceIdResult.data.video_MediaLiveChannel.length !== 1 ||
        !conferenceIdResult.data.video_MediaLiveChannel[0].room
    ) {
        console.error(
            "Expected exactly one conference to be associated with MediaLive channel resource",
            channelResourceId
        );
        return;
    }

    const conferenceId = conferenceIdResult.data.video_MediaLiveChannel[0].room.conferenceId;

    let fillerVideoKey;
    try {
        fillerVideoKey = await getFillerVideos(conferenceId);
    } catch (e) {
        console.warn("Could not find filler video, will not switch to it.");
        return;
    }

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

async function getFillerVideos(conferenceId: string): Promise<string> {
    let urlPath;
    try {
        const fillerVideosConfiguration = await getConferenceConfiguration<string[]>(conferenceId, "FILLER_VIDEOS");
        if (!fillerVideosConfiguration || fillerVideosConfiguration.length < 1) {
            throw new Error("Could not retrieve FILLER_VIDEOS configuration for conference");
        }

        const { key } = new AmazonS3URI(fillerVideosConfiguration[0]);
        urlPath = key;
    } catch (e) {
        console.error("Error parsing filler video URI", conferenceId, e);
    }

    if (!urlPath) {
        console.error("Could not parse filler video URI", conferenceId, urlPath);
        throw new Error("Could not parse filler video URI");
    }

    return urlPath;
}

// function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
//     return value !== null && value !== undefined;
// }
