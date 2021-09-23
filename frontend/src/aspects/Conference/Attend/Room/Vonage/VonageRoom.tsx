import { gql, useApolloClient } from "@apollo/client";
import { Box, Flex, useBreakpointValue, useToast } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFullScreenHandle } from "react-full-screen";
import * as portals from "react-reverse-portal";
import { useLocation } from "react-router-dom";
import { validate } from "uuid";
import {
    Room_EventSummaryFragment,
    Room_EventSummaryFragmentDoc,
    useDeleteEventParticipantMutation,
    useSaveVonageRoomRecordingMutation,
} from "../../../../../generated/graphql";
import useUserId from "../../../../Auth/useUserId";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import { useRaiseHandState } from "../../../../RaiseHand/RaiseHandProvider";
import {
    useVonageRoom,
    VonageRoomState,
    VonageRoomStateActionType,
    VonageRoomStateProvider,
} from "../../../../Vonage/useVonageRoom";
import { RegistrantIdSpec, useRegistrants } from "../../../RegistrantsContext";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import { PreJoin } from "../PreJoin";
import type { DevicesProps } from "../VideoChat/PermissionInstructions";
import CameraContainer from "./Components/CameraContainer";
import { CameraViewport } from "./Components/CameraViewport";
import Layout from "./Components/Layout";
import type { Viewport } from "./Components/LayoutTypes";
import { useVonageComputedState } from "./useVonageComputedState";
import { StateType, VonageGlobalState } from "./VonageGlobalState";
import { AvailableStream, useVonageLayout, VonageLayout, VonageLayoutProvider } from "./VonageLayoutProvider";
import { VonageRoomControlBar } from "./VonageRoomControlBar";

gql`
    mutation DeleteEventParticipant($eventId: uuid!, $registrantId: uuid!) {
        delete_schedule_EventProgramPerson(
            where: {
                eventId: { _eq: $eventId }
                person: { registrantId: { _eq: $registrantId } }
                roleName: { _eq: PARTICIPANT }
            }
        ) {
            returning {
                id
            }
        }
    }

    mutation SaveVonageRoomRecording($recordingId: uuid!, $registrantId: uuid!) {
        insert_registrant_SavedVonageRoomRecording_one(
            object: { recordingId: $recordingId, registrantId: $registrantId }
            on_conflict: { constraint: SavedVonageRoomRecording_recordingId_registrantId_key, update_columns: [] }
        ) {
            id
            recordingId
            registrantId
            isHidden
        }
    }
`;

export function VonageRoom({
    eventId,
    vonageSessionId,
    getAccessToken,
    disable,
    isBackstageRoom,
    raiseHandPrejoinEventId,
    isRaiseHandWaiting,
    requireMicrophoneOrCamera = false,
    completeJoinRef,
    onLeave,
    onPermissionsProblem,
    canControlRecording,
}: {
    eventId: string | null;
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
    disable: boolean;
    isBackstageRoom: boolean;
    raiseHandPrejoinEventId: string | null;
    isRaiseHandWaiting?: boolean;
    requireMicrophoneOrCamera?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    onLeave?: () => void;
    onPermissionsProblem: (devices: DevicesProps, title: string | null) => void;
    canControlRecording: boolean;
    layout?: VonageLayout;
}): JSX.Element {
    const mRegistrant = useMaybeCurrentRegistrant();

    const location = useLocation();
    const locationParts = (location.pathname.startsWith("/") ? location.pathname.substr(1) : location.pathname).split(
        "/"
    );
    // Array(5) [ "conference", "demo2021", "room", "96b73184-a5ae-4356-81d7-5f99689d1413" ]
    const roomCouldBeInUse = locationParts[0] === "conference" && locationParts[2] === "room";

    const raiseHand = useRaiseHandState();

    const [deleteEventParticipant] = useDeleteEventParticipantMutation();
    const apolloClient = useApolloClient();

    return (
        <VonageRoomStateProvider onPermissionsProblem={onPermissionsProblem}>
            <ChatProfileModalProvider>
                {mRegistrant ? (
                    <VonageLayoutProvider vonageSessionId={vonageSessionId}>
                        <VonageRoomInner
                            vonageSessionId={vonageSessionId}
                            stop={!roomCouldBeInUse || disable}
                            getAccessToken={getAccessToken}
                            isBackstageRoom={isBackstageRoom}
                            requireMicrophoneOrCamera={requireMicrophoneOrCamera}
                            joinRoomButtonText={
                                isBackstageRoom
                                    ? raiseHandPrejoinEventId
                                        ? "I'm ready"
                                        : "Connect to the backstage"
                                    : undefined
                            }
                            overrideJoining={
                                isBackstageRoom && raiseHandPrejoinEventId && isRaiseHandWaiting ? true : undefined
                            }
                            beginJoin={
                                isBackstageRoom && raiseHandPrejoinEventId
                                    ? () => {
                                          if (raiseHandPrejoinEventId) {
                                              raiseHand.raise(raiseHandPrejoinEventId);
                                          }
                                      }
                                    : undefined
                            }
                            cancelJoin={
                                isBackstageRoom && raiseHandPrejoinEventId
                                    ? () => {
                                          if (raiseHandPrejoinEventId) {
                                              raiseHand.lower(raiseHandPrejoinEventId);
                                          }
                                      }
                                    : undefined
                            }
                            completeJoinRef={completeJoinRef}
                            onRoomJoined={
                                isBackstageRoom && eventId
                                    ? (joined) => {
                                          if (!joined) {
                                              if (eventId) {
                                                  deleteEventParticipant({
                                                      variables: {
                                                          eventId,
                                                          registrantId: mRegistrant.id,
                                                      },
                                                      update: (cache, response) => {
                                                          if (
                                                              response.data?.delete_schedule_EventProgramPerson
                                                                  ?.returning
                                                          ) {
                                                              const data =
                                                                  response.data.delete_schedule_EventProgramPerson
                                                                      .returning;
                                                              const fragmentId = apolloClient.cache.identify({
                                                                  __typename: "schedule_Event",
                                                                  id: eventId,
                                                              });
                                                              const eventFragment =
                                                                  apolloClient.cache.readFragment<Room_EventSummaryFragment>(
                                                                      {
                                                                          fragment: Room_EventSummaryFragmentDoc,
                                                                          id: fragmentId,
                                                                          fragmentName: "Room_EventSummary",
                                                                      }
                                                                  );
                                                              if (eventFragment) {
                                                                  apolloClient.cache.writeFragment({
                                                                      fragment: Room_EventSummaryFragmentDoc,
                                                                      id: fragmentId,
                                                                      fragmentName: "Room_EventSummary",
                                                                      data: {
                                                                          ...eventFragment,
                                                                          eventPeople: eventFragment.eventPeople.filter(
                                                                              (x) => !data.some((y) => x.id === y.id)
                                                                          ),
                                                                      },
                                                                  });
                                                              }
                                                          }
                                                      },
                                                  });
                                              }

                                              onLeave?.();
                                          }
                                      }
                                    : undefined
                            }
                            onPermissionsProblem={onPermissionsProblem}
                            canControlRecording={canControlRecording}
                        />
                    </VonageLayoutProvider>
                ) : undefined}
            </ChatProfileModalProvider>
        </VonageRoomStateProvider>
    );
}

function VonageRoomInner({
    vonageSessionId,
    getAccessToken,
    stop,
    isBackstageRoom,
    onRoomJoined,
    joinRoomButtonText,
    requireMicrophoneOrCamera,
    overrideJoining,
    beginJoin,
    cancelJoin,
    completeJoinRef,
    onPermissionsProblem,
    canControlRecording,
}: {
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
    stop: boolean;
    isBackstageRoom: boolean;
    joinRoomButtonText?: string;
    requireMicrophoneOrCamera: boolean;
    onRoomJoined?: (_joined: boolean) => void;
    overrideJoining?: boolean;
    beginJoin?: () => void;
    cancelJoin?: () => void;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    onPermissionsProblem: (devices: DevicesProps, title: string | null) => void;
    canControlRecording: boolean;
}): JSX.Element {
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);

    const currentRegistrant = useCurrentRegistrant();
    const [saveVonageRoomRecording] = useSaveVonageRoomRecordingMutation();

    const [isRecordingActive, setIsRecordingActive] = useState<boolean>(false);
    const onRecordingStarted = useCallback(() => {
        setIsRecordingActive(true);
    }, []);
    const onRecordingStopped = useCallback(() => {
        setIsRecordingActive(false);
    }, []);
    const onRecordingIdReceived = useCallback(
        (recordingId: string) => {
            saveVonageRoomRecording({
                variables: {
                    recordingId,
                    registrantId: currentRegistrant.id,
                },
            });
        },
        [currentRegistrant.id, saveVonageRoomRecording]
    );

    const { state, dispatch } = useVonageRoom();
    const { vonage, connected, connections, streams, screen, camera, joining, leaveRoom, joinRoom } =
        useVonageComputedState({
            getAccessToken,
            vonageSessionId,
            overrideJoining,
            onRoomJoined,
            onRecordingStarted,
            onRecordingStopped,
            onRecordingIdReceived,
            isBackstageRoom,
            beginJoin,
            cancelJoin,
            completeJoinRef,
        });

    useEffect(() => {
        if (!connected) {
            setIsRecordingActive(false);
        }
    }, [connected]);

    useEffect(() => {
        setIsRecordingActive(false);
    }, [vonageSessionId]);

    const preJoin = useMemo(
        () => (connected ? undefined : <PreJoin cameraPreviewRef={cameraPreviewRef} />),
        [connected]
    );

    const userId = useUserId();
    const registrant = useCurrentRegistrant();

    const registrantIdSpecs = useMemo(
        () =>
            connections
                .map((connection) => {
                    try {
                        const data = JSON.parse(connection.data);
                        return data["registrantId"] && validate(data["registrantId"])
                            ? { registrant: data["registrantId"] }
                            : null;
                    } catch (e) {
                        console.warn("Couldn't parse registrant ID from Vonage subscriber data", connection.data);
                        return null;
                    }
                })
                .filter((x) => !!x) as RegistrantIdSpec[],
        [connections]
    );
    const registrants = useRegistrants(registrantIdSpecs);
    const { setAvailableStreams } = useVonageLayout();
    useEffect(() => {
        const result: AvailableStream[] = [];
        if (vonage.state.type === StateType.Connected) {
            if (vonage.state.session?.connection) {
                if (screen) {
                    result.push({
                        connectionId: vonage.state.session.connection.connectionId,
                        streamId: screen.stream?.streamId,
                        type: "screen",
                        registrantName: registrant.displayName,
                    });
                }

                result.push({
                    connectionId: vonage.state.session.connection.connectionId,
                    streamId: camera?.stream?.streamId,
                    type: "camera",
                    registrantName: registrant.displayName,
                });
            }
        }
        for (const stream of streams) {
            let registrantId: string | undefined;
            try {
                const data = JSON.parse(stream.connection.data);
                registrantId =
                    data["registrantId"] && validate(data["registrantId"]) ? data["registrantId"] : undefined;
            } catch {
                // None
            }
            result.push({
                connectionId: stream.connection.connectionId,
                streamId: stream.streamId,
                registrantName: registrantId
                    ? registrants.find((reg) => reg.id === registrantId)?.displayName
                    : undefined,
                type: stream.videoType ?? "camera",
            });
        }
        for (const connection of connections) {
            if (
                userId &&
                !connection.data.includes(userId) &&
                !streams.find(
                    (stream) =>
                        stream.connection.connectionId === connection.connectionId &&
                        (!stream.videoType || stream.videoType === "camera")
                )
            ) {
                let registrantId: string | undefined;
                try {
                    const data = JSON.parse(connection.data);
                    registrantId =
                        data["registrantId"] && validate(data["registrantId"]) ? data["registrantId"] : undefined;
                } catch {
                    // None
                }
                result.push({
                    connectionId: connection.connectionId,
                    registrantName: registrantId
                        ? registrants.find((reg) => reg.id === registrantId)?.displayName
                        : undefined,
                    type: "camera",
                });
            }
        }
        setAvailableStreams(result);
    }, [
        connections,
        setAvailableStreams,
        registrants,
        streams,
        userId,
        vonage.state,
        screen,
        camera?.stream?.streamId,
        registrant.displayName,
    ]);

    const resolutionBP = useBreakpointValue<"low" | "normal" | "high">({
        base: "low",
        lg: "normal",
    });
    const receivingScreenShareCount = useMemo(() => streams.filter((s) => s.videoType === "screen").length, [streams]);
    const allScreenShareCount = receivingScreenShareCount + (screen ? 1 : 0);
    // THIS NEEDS REVISING - THE USER SHOULD HAVE CONTROL OVER THE MAXIMUM NUMBER OF VIDEO STREAMS
    const [maxVideoStreams, setMaxVideoStreams] = useState<number>(allScreenShareCount ? 4 : 10);
    const [cameraResolution, setCameraResolution] = useState<"low" | "normal" | "high">(
        !isBackstageRoom && (allScreenShareCount || connections.length >= maxVideoStreams)
            ? "low"
            : resolutionBP ?? "normal"
    );
    // WE SHOULD ENABLE HIGH FRAMERATE FOR PRESENTERS IN A VIDEO-CHAT EVENT
    const [cameraFramerate, setCameraFramerate] = useState<7 | 15 | 30>(isBackstageRoom ? 30 : 15);

    // Camera / microphone enable/disable control
    useEffect(() => {
        if (stop) {
            // Disconnect from the Vonage session, then soft-disable the microphone and camera
            leaveRoom().catch((e) => console.error("Failed to leave Vonage room", e));
            dispatch({
                type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                microphoneEnabled: false,
                explicitlyDisabled: state.microphoneExplicitlyDisabled,
                onError: undefined,
            });
            dispatch({
                type: VonageRoomStateActionType.SetCameraIntendedState,
                cameraEnabled: false,
                explicitlyDisabled: state.cameraExplicitlyDisabled,
                onError: undefined,
            });
        } else if (!connected && !joining) {
            // Auto-start devices if we already have MediaStreams available
            if (
                !state.cameraExplicitlyDisabled &&
                state.cameraStream?.getVideoTracks().some((t) => t.readyState === "live")
            ) {
                dispatch({
                    type: VonageRoomStateActionType.SetCameraIntendedState,
                    cameraEnabled: true,
                    onError: () => {
                        dispatch({
                            type: VonageRoomStateActionType.SetCameraMediaStream,
                            mediaStream: "disabled",
                        });
                    },
                });
            }
            if (
                !state.microphoneExplicitlyDisabled &&
                state.microphoneStream?.getAudioTracks().some((t) => t.readyState === "live")
            ) {
                dispatch({
                    type: VonageRoomStateActionType.SetMicrophoneIntendedState,
                    microphoneEnabled: true,
                    onError: () => {
                        dispatch({
                            type: VonageRoomStateActionType.SetMicrophoneMediaStream,
                            mediaStream: "disabled",
                        });
                    },
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stop]);

    //////// THIS NEEDS A TOTAL RETHINK SO THAT ALL SUBSCRIBED STREAMS ARE
    //////// POLLED AT THE SAME TIME AND DON'T GENERATE A BAZILLION OBJECTS
    //////// EVERY TIME ONE THING CHANGES.
    const [streamLastActive, setStreamLastActive] = useState<{ [streamId: string]: number }>({});
    const setStreamActivity = useCallback((streamId: string, activity: boolean) => {
        if (activity) {
            setStreamLastActive((streamLastActiveData) => ({
                ...streamLastActiveData,
                [streamId]: Date.now(),
            }));
        }
    }, []);

    // THIS PROBABLY ISN'T NECESSARY - WE SHOULD GENERATE A DESCRIPTION OF EACH
    // SUBSCRIBED STREAM TYPE AND JUST PASS THAT WITH THE ELEMENT INTO THE
    // LAYOUT MAPPER.
    const othersCameraStreams = useMemo(
        () => streams.filter((s) => s.videoType === "camera" || !s.videoType),
        [streams]
    );

    //////////////////// START ////////////////////
    //// ALL OF THIS NEEDS TO BE MOVED INTO AN INNER `STREAM-ELEMENT <-> VISUAL POSITION` MAPPING COMPONENT

    // TODO: The activity system is currently broken
    // TODO: Provide the layout system a way to force-enable videos depending on where they are in the layout
    const [enableStreams, setEnableStreams] = useState<string[] | null>(null);
    useEffect(() => {
        if (othersCameraStreams.length <= maxVideoStreams) {
            setEnableStreams(null);
        } else {
            const streamTimestamps = R.toPairs<number>(streamLastActive);
            // console.log(`${new Date().toISOString()}: Proceeding with computing enabled streams`, streamTimestamps);
            const activeStreams = R.sortWith(
                [R.descend((pair) => pair[1]), R.ascend((pair) => pair[0])],
                streamTimestamps
            )
                .map((pair) => pair[0])
                .filter((streamId) =>
                    othersCameraStreams.find((stream) => stream.streamId === streamId && stream.hasVideo)
                );
            const selectedActiveStreams = activeStreams.slice(0, Math.min(activeStreams.length, maxVideoStreams));

            const remainingSlots = maxVideoStreams - selectedActiveStreams.length;
            const topUpStreams = R.sortWith(
                [R.ascend((s) => s.hasVideo), R.ascend((s) => s.connection.creationTime)],
                othersCameraStreams.filter((s) => !selectedActiveStreams.includes(s.streamId))
            ).map((s) => s.streamId);
            const selectedTopUpStreams = topUpStreams.slice(0, Math.min(topUpStreams.length, remainingSlots));
            selectedActiveStreams.push(...selectedTopUpStreams);

            setEnableStreams((oldEnabledStreams) => {
                if (!oldEnabledStreams) {
                    // console.log("Active speakers changed (1)");
                    return selectedActiveStreams;
                }

                if (
                    selectedActiveStreams.length !== oldEnabledStreams.length ||
                    oldEnabledStreams.some((x) => !selectedActiveStreams.includes(x)) ||
                    selectedActiveStreams.some((x) => !oldEnabledStreams.includes(x))
                ) {
                    // console.log("Active speakers changed (2)");
                    return selectedActiveStreams;
                } else {
                    return oldEnabledStreams;
                }
            });
        }
    }, [maxVideoStreams, othersCameraStreams, othersCameraStreams.length, allScreenShareCount, streamLastActive]);

    // TODO
    // const [sortedStreams, setSortedStreams] = useState<OT.Stream[]>([]);
    // const sortCameraStreamsWhileScreenSharing = useCallback(
    //     (cameraStreams: OT.Stream[], enableStreams: string[] | null, maxVideoStreams: number): OT.Stream[] => {
    //         if (enableStreams) {
    //             // The number of videos exceeds the maximum, so we pull the active ones to the top
    //             const screenConnections = streams
    //                 .filter((stream) => stream.videoType === "screen")
    //                 .map((x) => x.connection.connectionId);
    //             const screenCameraStreams = R.sortWith(
    //                 [R.ascend((s) => s.connection.creationTime)],
    //                 cameraStreams.filter((x) => screenConnections.includes(x.connection.connectionId))
    //             );
    //             const screenCameraStreamIds = screenCameraStreams.map((x) => x.streamId);
    //             const scsCount = screenCameraStreams.length;

    //             const currentStreamIds = cameraStreams.map((x) => x.streamId);
    //             const existingActiveStreams = sortedStreams
    //                 .slice(0, maxVideoStreams)
    //                 .filter(
    //                     (x) =>
    //                         currentStreamIds.includes(x.streamId) &&
    //                         enableStreams?.includes(x.streamId) &&
    //                         !screenCameraStreamIds.includes(x.streamId)
    //                 );
    //             const existingActiveStreamIds = existingActiveStreams.map((x) => x.streamId);
    //             const easCount = existingActiveStreams.length;
    //             const newlyActiveStreams = cameraStreams.filter(
    //                 (x) =>
    //                     enableStreams?.includes(x.streamId) &&
    //                     !existingActiveStreamIds.includes(x.streamId) &&
    //                     !screenCameraStreamIds.includes(x.streamId)
    //             );

    //             const sortedNewlyActiveStreams = R.sortWith(
    //                 [R.descend((x) => streamLastActive[x.streamId])],
    //                 newlyActiveStreams
    //             );
    //             const nasCount = sortedNewlyActiveStreams.length;
    //             const rest = R.sortWith(
    //                 [R.ascend((s) => s.connection.creationTime)],
    //                 cameraStreams.filter(
    //                     (x) => !enableStreams?.includes(x.streamId) && !screenCameraStreamIds.includes(x.streamId)
    //                 )
    //             );
    //             const restCount = rest.length;
    //             console.log(`scs: ${scsCount}, eas: ${easCount}, nas: ${nasCount}, rest: ${restCount}`);
    //             return screenCameraStreams.concat(sortedNewlyActiveStreams).concat(existingActiveStreams).concat(rest);
    //         } else {
    //             // The number of streams is within the maximum, so we put the sharer's camera first, then sort by creation
    //             const screenConnections = streams
    //                 .filter((stream) => stream.videoType === "screen")
    //                 .map((x) => x.connection.connectionId);
    //             const screenCameraStreams = R.sortWith(
    //                 [R.ascend((s) => s.connection.creationTime)],
    //                 cameraStreams.filter((x) => screenConnections.includes(x.connection.connectionId))
    //             );
    //             const rest = R.sortWith(
    //                 [R.ascend((s) => s.connection.creationTime)],
    //                 cameraStreams.filter((x) => !screenConnections.includes(x.connection.connectionId))
    //             );
    //             return screenCameraStreams.concat(rest);
    //         }
    //     },
    //     [sortedStreams, streamLastActive, streams]
    // );

    ////////////////////  END  ////////////////////

    // PRESUMABLY THIS FULL SCREEN STUFF SHOULD BE HANDLED WITHIN THE LAYOUT SYSTEM

    const fullScreenHandle = useFullScreenHandle();
    useEffect(() => {
        if (!receivingScreenShareCount && fullScreenHandle.active) {
            fullScreenHandle.exit().catch((e) => console.error("Failed to exit full screen", e));
        }
    }, [fullScreenHandle, receivingScreenShareCount]);

    /* OKAY, SO ALL THIS ELEMENT GENERATOR CODE NEEDS RESTRUCTURING TO CREATE
     * A SIMPLE LIST OF ELEMENTS AND SOME METADATA:
     *      - Stream Id             (string)
     *      - Associated Stream Ids (string[] - screenshares / cameras by the same participant)
     *      - Video Type            (screen, camera)
     *      - Is Self               (boolean)
     *      - Joined At Time        (milliseconds)
     *
     *
     * AND WE THEN COMBINE THAT WITH THE `layoutData` TO GENERATE THE FINAL
     * LAYOUT.
     *      - In the case of backstage layouts, we create a defined/headed
     *        area for streams not being included in the broadcast.
     *      - In the case of backstage layouts, if best-fit mode is chosen,
     *        we attempt to replicate Vonage's rules.
     *      - In the case of non-backstage layouts, if best-fit mode is chosen,
     *        we use our own screenshares-first, then most-recent-speaker logic.
     *      - Regardless, the overflow area uses the most-recent-speaker logic
     *        to select visible streams.
     *      - The user's own stream box should always be visible, either within
     *        the main layout area or the first box in the overflow area.
     *          - If not in backstage mode or in overflow area, possibly show an
     *            indicator that they may not be visible if they haven't spoken
     *            in a while.
     *
     *
     * WE THEN NEED TO LAYER ON TWO LAYOUT CONTROLS:
     *      1. The ability to choose the base layout type
     *              - When choosing a layout, we should make it easy to tell
     *                what that layout will be - possibly with little pictures.
     *              - When switching base layout type, we use the stream1-N
     *                names to re-assign streams to slots as appropriate.
     *
     *                Ideally, we should retain assignments for streams that
     *                don't fit a slot in the selected layout until the user
     *                saves the layout (or cancels).
     *
     *      2. If applicable, the ability to drag and drop streams into the
     *         layout zones.
     *              - If insufficient zones are filled, then when saving the
     *                layout, we compute a nearest-approximation.
     */

    const screenPortalNode = React.useMemo(() => portals.createHtmlPortalNode(), []);
    const cameraPortalNode = React.useMemo(() => portals.createHtmlPortalNode(), []);
    const [streamPortalNodes, setStreamPortalNodes] = React.useState(
        new Map<string, { node: portals.HtmlPortalNode; element: JSX.Element }>()
    );
    const [connectionPortalNodes, setConnectionPortalNodes] = React.useState(
        new Map<string, { node: portals.HtmlPortalNode; element: JSX.Element }>()
    );

    useEffect(() => {
        for (const streamId of streamPortalNodes.keys()) {
            if (!streams.some((stream) => stream.streamId === streamId)) {
                streamPortalNodes.delete(streamId);
            }
        }
        for (const connectionId of connectionPortalNodes.keys()) {
            if (!connections.some((connection) => connection.connectionId === connectionId)) {
                connectionPortalNodes.delete(connectionId);
            }
        }
    }, [streams, connections, streamPortalNodes, connectionPortalNodes]);

    const viewports = useMemo<Viewport[]>(() => {
        const result: Viewport[] = [];
        const streamPortalNodesResult = new Map(streamPortalNodes);
        const connectionPortalNodesResult = new Map(connectionPortalNodes);

        if (vonage.state.type === StateType.Connected) {
            if (vonage.state.session) {
                const connection = vonage.state.session.connection;
                if (connection) {
                    if (screen?.stream) {
                        result.push({
                            connectionId: connection.connectionId,
                            streamId: screen?.stream?.streamId,
                            associatedIds: camera?.stream
                                ? [connection.connectionId, camera.stream.streamId]
                                : [connection.connectionId],
                            type: "screen",
                            joinedAt: screen?.stream?.creationTime ?? connection.creationTime,
                            isSelf: true,

                            component: screenPortalNode,
                        });
                    }

                    result.push({
                        connectionId: connection.connectionId,
                        streamId: camera?.stream?.streamId,
                        associatedIds: screen?.stream
                            ? [connection.connectionId, screen.stream.streamId]
                            : [connection.connectionId],
                        type: "camera",
                        joinedAt: camera?.stream?.creationTime ?? connection.creationTime,
                        isSelf: true,

                        component: cameraPortalNode,
                    });
                }
            }

            for (const stream of streams) {
                let portalNode = streamPortalNodesResult.get(stream.streamId);
                if (!portalNode) {
                    const node = portals.createHtmlPortalNode();
                    portalNode = {
                        node,
                        element: (
                            <portals.InPortal key={stream.streamId} node={node}>
                                <CameraViewport
                                    stream={stream}
                                    connection={stream.connection}
                                    onUpdateIsTalking={(isTalking) => setStreamActivity(stream.streamId, isTalking)}
                                    enableVideo={
                                        stream.videoType === "screen" ||
                                        !enableStreams ||
                                        !!enableStreams.includes(stream.streamId)
                                    }
                                    resolution={stream.videoType === "screen" ? "high" : cameraResolution}
                                    framerate={stream.videoType === "screen" ? 30 : cameraFramerate}
                                />
                            </portals.InPortal>
                        ),
                    };
                    streamPortalNodesResult.set(stream.streamId, portalNode);
                }

                result.push({
                    connectionId: stream.connection.connectionId,
                    streamId: stream.streamId,
                    associatedIds: [
                        stream.connection.connectionId,
                        ...streams
                            .filter((x) => x.connection.connectionId === stream.connection.connectionId && x !== stream)
                            .map((x) => x.streamId),
                    ],
                    type: stream.videoType ?? "camera",
                    joinedAt: stream.creationTime,
                    isSelf: false,

                    component: portalNode.node,
                });
            }

            for (const connection of connections) {
                if (
                    userId &&
                    !connection.data.includes(userId) &&
                    !streams.find(
                        (stream) =>
                            stream.connection.connectionId === connection.connectionId &&
                            (!stream.videoType || stream.videoType === "camera")
                    )
                ) {
                    let portalNode = connectionPortalNodesResult.get(connection.connectionId);
                    if (!portalNode) {
                        const node = portals.createHtmlPortalNode();
                        portalNode = {
                            node,
                            element: (
                                <portals.InPortal key={connection.connectionId} node={node}>
                                    <CameraViewport connection={connection} />
                                </portals.InPortal>
                            ),
                        };
                        connectionPortalNodesResult.set(connection.connectionId, portalNode);
                    }

                    result.push({
                        connectionId: connection.connectionId,
                        associatedIds: [
                            connection.connectionId,
                            ...streams
                                .filter((x) => x.connection.connectionId === connection.connectionId)
                                .map((x) => x.streamId),
                        ],
                        type: "camera",
                        joinedAt: connection.creationTime,
                        isSelf: false,

                        component: portalNode.node,
                    });
                }
            }
        }

        setStreamPortalNodes(streamPortalNodesResult);
        setConnectionPortalNodes(connectionPortalNodesResult);

        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        camera?.stream,
        cameraFramerate,
        cameraPortalNode,
        cameraResolution,
        connections,
        enableStreams,
        screen?.stream,
        screenPortalNode,
        setStreamActivity,
        streams,
        userId,
        vonage.state,
    ]);

    return (
        <Box width="100%" isolation="isolate">
            <Flex mt={4} justifyContent="center" alignItems="center" flexWrap="wrap" w="100%">
                {preJoin}
                {/* Use memo'ing the control bar causes the screenshare button to not update properly 🤔 */}
                <VonageRoomControlBar
                    onJoinRoom={joinRoom}
                    onLeaveRoom={leaveRoom}
                    onCancelJoinRoom={cancelJoin}
                    joining={joining}
                    joinRoomButtonText={joinRoomButtonText}
                    requireMicrophoneOrCamera={requireMicrophoneOrCamera}
                    onPermissionsProblem={onPermissionsProblem}
                    isRecordingActive={isRecordingActive}
                    isBackstage={isBackstageRoom}
                    canControlRecording={canControlRecording}
                />
            </Flex>
            {connected ? (
                <Box position="relative" width="100%">
                    <Layout
                        viewports={viewports}
                        isRecordingMode={isBackstageRoom || isRecordingActive}
                        isBackstage={isBackstageRoom}
                    />
                </Box>
            ) : undefined}
            {[...streamPortalNodes.values()].map((x) => x.element)}
            {[...connectionPortalNodes.values()].map((x) => x.element)}
            <portals.InPortal node={screenPortalNode}>
                <SelfScreenComponent
                    connected={connected}
                    state={state}
                    vonage={vonage}
                    registrantId={registrant.id}
                    screen={screen}
                />
            </portals.InPortal>
            <portals.InPortal node={cameraPortalNode}>
                <SelfCameraComponent
                    connected={connected}
                    state={state}
                    vonage={vonage}
                    registrantId={registrant.id}
                    isBackstageRoom={isBackstageRoom}
                />
            </portals.InPortal>
        </Box>
    );
}

function SelfCameraComponent({
    connected,
    state,
    vonage,
    registrantId,
    isBackstageRoom,
}: {
    connected: boolean;
    state: VonageRoomState;
    vonage: VonageGlobalState;
    registrantId: string;
    isBackstageRoom: boolean;
}): JSX.Element {
    const toast = useToast();

    const cameraPublishContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        async function fn() {
            if (connected) {
                try {
                    await vonage.publishCamera(
                        cameraPublishContainerRef.current as HTMLElement,
                        state.cameraIntendedEnabled ? state.preferredCameraId : null,
                        state.microphoneIntendedEnabled ? state.preferredMicrophoneId : null,
                        // TODO: OR IN VIDEO-CHAT: PRESENTERS AND CHAIRS
                        isBackstageRoom ? "1280x720" : "640x480"
                    );
                } catch (err) {
                    console.error("Failed to publish camera or microphone", {
                        err,
                        cameraIntendedEnabled: state.cameraIntendedEnabled,
                        microphoneIntendedEnabled: state.microphoneIntendedEnabled,
                    });
                }
            }
        }
        fn();
    }, [
        connected,
        state.cameraIntendedEnabled,
        state.microphoneIntendedEnabled,
        state.preferredCameraId,
        state.preferredMicrophoneId,
        toast,
        vonage,
        isBackstageRoom,
    ]);

    return (
        <CameraViewport registrantId={registrantId} enableVideo={true}>
            <CameraContainer ref={cameraPublishContainerRef} />
        </CameraViewport>
    );
}

function SelfScreenComponent({
    connected,
    state,
    vonage,
    registrantId,
    screen,
}: {
    connected: boolean;
    state: VonageRoomState;
    vonage: VonageGlobalState;
    registrantId: string;
    screen: OT.Publisher | null;
}): JSX.Element {
    const toast = useToast();

    const screenPublishContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        async function fn() {
            if (connected) {
                if (state.screenShareIntendedEnabled && !screen) {
                    try {
                        await vonage.publishScreen(screenPublishContainerRef.current as HTMLElement);
                    } catch (e) {
                        console.error("Failed to publish screen", e);
                        toast({
                            status: "error",
                            title: "Failed to share screen",
                        });
                    }
                } else if (!state.screenShareIntendedEnabled && screen) {
                    try {
                        await vonage.unpublishScreen();
                    } catch (e) {
                        console.error("Failed to unpublish screen", e);
                        toast({
                            status: "error",
                            title: "Failed to unshare screen",
                        });
                    }
                }
            }
        }
        fn();
    }, [connected, state.screenShareIntendedEnabled, screen, toast, vonage]);

    return (
        <CameraViewport registrantId={registrantId} enableVideo={true}>
            <CameraContainer ref={screenPublishContainerRef} />
        </CameraViewport>
    );
}
