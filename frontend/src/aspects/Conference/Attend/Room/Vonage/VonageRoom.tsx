import { gql, useApolloClient } from "@apollo/client";
import { Alert, AlertIcon, AlertTitle, Box, Flex, useBreakpointValue, useToast } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import { useLocation } from "react-router-dom";
import {
    Room_EventSummaryFragment,
    Room_EventSummaryFragmentDoc,
    useDeleteEventParticipantMutation,
    useSaveVonageRoomRecordingMutation,
} from "../../../../../generated/graphql";
import useUserId from "../../../../Auth/useUserId";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import { useRaiseHandState } from "../../../../RaiseHand/RaiseHandProvider";
import { useVonageRoom, VonageRoomStateActionType, VonageRoomStateProvider } from "../../../../Vonage/useVonageRoom";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import PlaceholderImage from "../PlaceholderImage";
import { PreJoin } from "../PreJoin";
import type { DevicesProps } from "../VideoChat/PermissionInstructions";
import SubscriberControlBar from "./SubscriberControlBar";
import { useVonageComputedState } from "./useVonageComputedState";
import { VonageOverlay } from "./VonageOverlay";
import { VonageRoomControlBar } from "./VonageRoomControlBar";
import { VonageSubscriber } from "./VonageSubscriber";

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
                                                          response.data?.delete_schedule_EventProgramPerson?.returning
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
    const cameraPublishContainerRef = useRef<HTMLDivElement>(null);
    const screenPublishContainerRef = useRef<HTMLDivElement>(null);
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
            cameraPublishContainerRef,
        });

    useEffect(() => {
        if (!connected) {
            setIsRecordingActive(false);
        }
    }, [connected]);

    useEffect(() => {
        setIsRecordingActive(false);
    }, [vonageSessionId]);

    const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
    useEffect(() => {
        const unobserve = vonage.CameraEnabled.subscribe((enabled) => {
            setCameraEnabled(enabled);
        });
        return () => {
            unobserve();
        };
    }, [vonage]);

    const userId = useUserId();
    const registrant = useCurrentRegistrant();
    const toast = useToast();

    const resolutionBP = useBreakpointValue<"low" | "normal" | "high">({
        base: "low",
        lg: "normal",
    });
    const receivingScreenShare = useMemo(() => streams.find((s) => s.videoType === "screen"), [streams]);
    const screenSharingActive = receivingScreenShare || screen;
    const maxVideoStreams = screenSharingActive ? 4 : 10;
    const cameraResolution =
        screenSharingActive || connections.length >= maxVideoStreams ? "low" : resolutionBP ?? "normal";
    const participantWidth = cameraResolution === "low" ? 150 : 300;

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

    useEffect(() => {
        async function fn() {
            if (connected) {
                try {
                    await vonage.publishCamera(
                        cameraPublishContainerRef.current as HTMLElement,
                        state.cameraIntendedEnabled ? state.preferredCameraId : null,
                        state.microphoneIntendedEnabled ? state.preferredMicrophoneId : null
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
    ]);

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
    }, [connected, screen, state.screenShareIntendedEnabled, toast, vonage]);

    const [streamLastActive, setStreamLastActive] = useState<{ [streamId: string]: number }>({});
    const setStreamActivity = useCallback((streamId: string, activity: boolean) => {
        if (activity) {
            setStreamLastActive((streamLastActiveData) => ({
                ...streamLastActiveData,
                [streamId]: Date.now(),
            }));
        }
    }, []);
    const othersCameraStreams = useMemo(
        () => streams.filter((s) => s.videoType === "camera" || !s.videoType),
        [streams]
    );

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
    }, [maxVideoStreams, othersCameraStreams, othersCameraStreams.length, screenSharingActive, streamLastActive]);

    const [sortedStreams, setSortedStreams] = useState<OT.Stream[]>([]);
    const sortCameraStreamsWhileScreenSharing = useCallback(
        (cameraStreams: OT.Stream[], enableStreams: string[] | null, maxVideoStreams: number): OT.Stream[] => {
            if (enableStreams) {
                // The number of videos exceeds the maximum, so we pull the active ones to the top
                const screenConnections = streams
                    .filter((stream) => stream.videoType === "screen")
                    .map((x) => x.connection.connectionId);
                const screenCameraStreams = R.sortWith(
                    [R.ascend((s) => s.connection.creationTime)],
                    cameraStreams.filter((x) => screenConnections.includes(x.connection.connectionId))
                );
                const screenCameraStreamIds = screenCameraStreams.map((x) => x.streamId);
                const scsCount = screenCameraStreams.length;

                const currentStreamIds = cameraStreams.map((x) => x.streamId);
                const existingActiveStreams = sortedStreams
                    .slice(0, maxVideoStreams)
                    .filter(
                        (x) =>
                            currentStreamIds.includes(x.streamId) &&
                            enableStreams?.includes(x.streamId) &&
                            !screenCameraStreamIds.includes(x.streamId)
                    );
                const existingActiveStreamIds = existingActiveStreams.map((x) => x.streamId);
                const easCount = existingActiveStreams.length;
                const newlyActiveStreams = cameraStreams.filter(
                    (x) =>
                        enableStreams?.includes(x.streamId) &&
                        !existingActiveStreamIds.includes(x.streamId) &&
                        !screenCameraStreamIds.includes(x.streamId)
                );

                const sortedNewlyActiveStreams = R.sortWith(
                    [R.descend((x) => streamLastActive[x.streamId])],
                    newlyActiveStreams
                );
                const nasCount = sortedNewlyActiveStreams.length;
                const rest = R.sortWith(
                    [R.ascend((s) => s.connection.creationTime)],
                    cameraStreams.filter(
                        (x) => !enableStreams?.includes(x.streamId) && !screenCameraStreamIds.includes(x.streamId)
                    )
                );
                const restCount = rest.length;
                console.log(`scs: ${scsCount}, eas: ${easCount}, nas: ${nasCount}, rest: ${restCount}`);
                return screenCameraStreams.concat(sortedNewlyActiveStreams).concat(existingActiveStreams).concat(rest);
            } else {
                // The number of streams is within the maximum, so we put the sharer's camera first, then sort by creation
                const screenConnections = streams
                    .filter((stream) => stream.videoType === "screen")
                    .map((x) => x.connection.connectionId);
                const screenCameraStreams = R.sortWith(
                    [R.ascend((s) => s.connection.creationTime)],
                    cameraStreams.filter((x) => screenConnections.includes(x.connection.connectionId))
                );
                const rest = R.sortWith(
                    [R.ascend((s) => s.connection.creationTime)],
                    cameraStreams.filter((x) => !screenConnections.includes(x.connection.connectionId))
                );
                return screenCameraStreams.concat(rest);
            }
        },
        [sortedStreams, streamLastActive, streams]
    );

    useEffect(
        () =>
            setSortedStreams(
                screenSharingActive
                    ? sortCameraStreamsWhileScreenSharing(othersCameraStreams, enableStreams, maxVideoStreams)
                    : R.sortWith([R.ascend((s) => s.connection.creationTime)], othersCameraStreams)
            ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [othersCameraStreams, screenSharingActive, enableStreams, maxVideoStreams]
    );

    const viewPublishedScreenShareEl = useMemo(
        () => (
            <Box position="relative" maxH="80vh" hidden={!screen} height={"70vh"} width="100%" mb={2} overflow="hidden">
                <Box ref={screenPublishContainerRef} position="absolute" left="0" top="0" height="100%" width="100%" />
                <Box
                    position="absolute"
                    zIndex="200"
                    left="0"
                    top="0"
                    height="100%"
                    width="100%"
                    pointerEvents="none"
                />
                <Box position="absolute" zIndex="200" height="100%" width="100%">
                    <VonageOverlay connectionData={JSON.stringify({ registrantId: registrant.id })} />
                </Box>
            </Box>
        ),
        [registrant.id, screen]
    );

    const fullScreenHandle = useFullScreenHandle();

    useEffect(() => {
        if (!receivingScreenShare && fullScreenHandle.active) {
            fullScreenHandle.exit().catch((e) => console.error("Failed to exit full screen", e));
        }
    }, [fullScreenHandle, receivingScreenShare]);

    const viewSubscribedScreenShare = useMemo(
        () => (
            <FullScreen handle={fullScreenHandle}>
                <Box
                    onClick={async () => {
                        try {
                            if (fullScreenHandle.active) {
                                await fullScreenHandle.exit();
                            } else {
                                await fullScreenHandle.enter();
                            }
                        } catch (e) {
                            console.error("Could not enter full screen", e);
                        }
                    }}
                    maxH={fullScreenHandle.active ? "100%" : "80vh"}
                    height={fullScreenHandle.active ? "100%" : receivingScreenShare ? "70vh" : undefined}
                    width="100%"
                    mb={2}
                    zIndex={300}
                    hidden={!receivingScreenShare}
                >
                    {streams
                        .filter((stream) => stream.videoType === "screen")
                        .map((stream) => (
                            <VonageSubscriber
                                key={stream.streamId}
                                stream={stream}
                                enableVideo={true}
                                resolution={"high"}
                            />
                        ))}
                </Box>
            </FullScreen>
        ),
        [fullScreenHandle, receivingScreenShare, streams]
    );

    const connectionData = useMemo(() => JSON.stringify({ registrantId: registrant.id }), [registrant.id]);

    const viewPublishedPlaceholder = useMemo(
        () =>
            connected && !camera ? (
                <Box
                    position="relative"
                    flex={`0 0 ${participantWidth}px`}
                    w={participantWidth}
                    h={participantWidth}
                    bgColor="black"
                >
                    <Box position="absolute" zIndex="200" height="100%" width="100%" overflow="hidden">
                        <VonageOverlay
                            connectionData={connectionData}
                            microphoneEnabled={state.microphoneIntendedEnabled}
                        />
                    </Box>
                    <PlaceholderImage connectionData={connectionData} />
                </Box>
            ) : (
                <></>
            ),
        [connected, camera, participantWidth, connectionData, state.microphoneIntendedEnabled]
    );

    const viewPublishedCamera = useMemo(
        () => (
            <Box
                flex={`0 0 ${participantWidth}px`}
                w={participantWidth}
                h={participantWidth}
                display={connected && camera ? "block" : "none"}
            >
                <Box position="relative" height="100%" width="100%" overflow="hidden" bgColor="black">
                    <Box
                        ref={cameraPublishContainerRef}
                        position="absolute"
                        zIndex="100"
                        left="0"
                        top="0"
                        height="100%"
                        width="100%"
                    />
                    <Box
                        position="absolute"
                        zIndex="200"
                        left="0"
                        top="0"
                        height="100%"
                        width="100%"
                        pointerEvents="none"
                    />
                    {!cameraEnabled ? <PlaceholderImage zIndex={150} connectionData={connectionData} /> : undefined}
                    <Box position="absolute" zIndex="200" height="100%" width="100%" overflow="hidden">
                        <VonageOverlay
                            connectionData={JSON.stringify({ registrantId: registrant.id })}
                            microphoneEnabled={state.microphoneIntendedEnabled}
                        />
                    </Box>
                </Box>
            </Box>
        ),
        [
            participantWidth,
            connected,
            camera,
            registrant.id,
            state.microphoneIntendedEnabled,
            connectionData,
            cameraEnabled,
        ]
    );

    const preJoin = useMemo(() => (connected ? <></> : <PreJoin cameraPreviewRef={cameraPreviewRef} />), [connected]);

    const nobodyElseAlert = useMemo(
        () =>
            connected && connections.length <= 1 ? (
                <Alert status="info" mt={2} w="max-content">
                    <AlertIcon />
                    <AlertTitle>Nobody else has joined the room at the moment.</AlertTitle>
                </Alert>
            ) : (
                <></>
            ),
        [connected, connections.length]
    );

    const otherStreams = useMemo(
        () =>
            sortedStreams.map((stream) => (
                <Box key={stream.streamId} flex={`0 0 ${participantWidth}px`} w={participantWidth} h={participantWidth}>
                    <VonageSubscriber
                        stream={stream}
                        onChangeActivity={(activity) => setStreamActivity(stream.streamId, activity)}
                        enableVideo={!enableStreams || !!enableStreams.includes(stream.streamId)}
                        resolution={cameraResolution}
                    />
                </Box>
            )),
        [enableStreams, cameraResolution, participantWidth, setStreamActivity, sortedStreams]
    );

    const otherUnpublishedConnections = useMemo(
        () =>
            (connected ? connections : []).filter(
                (connection) =>
                    userId &&
                    !connection.data.includes(userId) &&
                    !streams.find(
                        (stream) =>
                            stream.connection.connectionId === connection.connectionId &&
                            (stream.videoType === "camera" || !stream.hasVideo)
                    )
            ),
        [connected, connections, streams, userId]
    );

    const otherPlaceholders = useMemo(
        () =>
            otherUnpublishedConnections.map((connection) => (
                <Box
                    key={connection.connectionId}
                    position="relative"
                    flex={`0 0 ${participantWidth}px`}
                    w={participantWidth}
                    h={participantWidth}
                    bgColor="black"
                >
                    <Box position="absolute" zIndex="200" width="100%" height="100%" overflow="hidden">
                        <VonageOverlay connectionData={connection.data} microphoneEnabled={false} />
                    </Box>
                    <PlaceholderImage connectionData={connection.data} />
                    <SubscriberControlBar connection={connection} />
                </Box>
            )),
        [otherUnpublishedConnections, participantWidth]
    );

    const joinRoom_ = useCallback(async () => {
        joinRoom();
    }, [joinRoom]);

    return (
        <Box width="100%">
            <Flex mt={4} justifyContent="center" alignItems="center" flexWrap="wrap" w="100%">
                {preJoin}
                {/* Use memo'ing the control bar causes the screenshare button to not update properly 🤔 */}
                <VonageRoomControlBar
                    onJoinRoom={joinRoom_}
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
            <Box position="relative" mb={8} width="100%">
                {viewPublishedScreenShareEl}

                {viewSubscribedScreenShare}

                <Flex
                    width="100%"
                    height="auto"
                    flexWrap={screenSharingActive ? "nowrap" : "wrap"}
                    overflowX={screenSharingActive ? "auto" : "hidden"}
                    overflowY={screenSharingActive ? "hidden" : "auto"}
                >
                    {viewPublishedPlaceholder}

                    {viewPublishedCamera}

                    {otherStreams}

                    {otherPlaceholders}
                </Flex>

                {nobodyElseAlert}
            </Box>
        </Box>
    );
}
