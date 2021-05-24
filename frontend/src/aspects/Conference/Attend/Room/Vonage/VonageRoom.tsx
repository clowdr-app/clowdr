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
} from "../../../../../generated/graphql";
import useUserId from "../../../../Auth/useUserId";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import { useRaiseHandState } from "../../../../RaiseHand/RaiseHandProvider";
import { useVonageRoom, VonageRoomStateActionType, VonageRoomStateProvider } from "../../../../Vonage/useVonageRoom";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import PlaceholderImage from "../PlaceholderImage";
import { PreJoin } from "../PreJoin";
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
`;

export function VonageRoom({
    eventId,
    vonageSessionId,
    getAccessToken,
    disable,
    isBackstageRoom,
    raiseHandPrejoinEventId,
    isRaiseHandWaiting,
    requireMicrophone = false,
    completeJoinRef,
    onLeave,
}: {
    eventId: string | null;
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
    disable: boolean;
    isBackstageRoom: boolean;
    raiseHandPrejoinEventId: string | null;
    isRaiseHandWaiting?: boolean;
    requireMicrophone?: boolean;
    completeJoinRef?: React.MutableRefObject<() => Promise<void>>;
    onLeave?: () => void;
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
        <VonageRoomStateProvider>
            <ChatProfileModalProvider>
                {mRegistrant ? (
                    <VonageRoomInner
                        vonageSessionId={vonageSessionId}
                        stop={!roomCouldBeInUse || disable}
                        getAccessToken={getAccessToken}
                        isBackstageRoom={isBackstageRoom}
                        requireMicrophone={requireMicrophone}
                        joinRoomButtonText={
                            isBackstageRoom ? (raiseHandPrejoinEventId ? "I'm ready" : "Join the backstage") : undefined
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
                        completeJoin={completeJoinRef}
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
                                                          const eventFragment = apolloClient.cache.readFragment<Room_EventSummaryFragment>(
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

    requireMicrophone,
    overrideJoining,
    beginJoin,
    cancelJoin,
    completeJoin,
}: {
    vonageSessionId: string;
    getAccessToken: () => Promise<string>;
    stop: boolean;
    isBackstageRoom: boolean;
    onRoomJoined?: (_joined: boolean) => void;
    joinRoomButtonText?: string;

    requireMicrophone: boolean;
    overrideJoining?: boolean;
    beginJoin?: () => void;
    cancelJoin?: () => void;
    completeJoin?: React.MutableRefObject<() => Promise<void>>;
}): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const { vonage, connected, connections, streams, screen, camera } = useVonageComputedState(
        getAccessToken,
        vonageSessionId
    );

    const userId = useUserId();
    const registrant = useCurrentRegistrant();
    const toast = useToast();

    const cameraPublishContainerRef = useRef<HTMLDivElement>(null);
    const screenPublishContainerRef = useRef<HTMLDivElement>(null);
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);

    const [_joining, setJoining] = useState<boolean>(false);
    const joining = !!overrideJoining || _joining;

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

    const joinRoom = useCallback(() => {
        async function doJoinRoom() {
            console.log("Joining room");
            setJoining(true);

            try {
                await vonage.connectToSession();
                onRoomJoined?.(true);
                await vonage.publishCamera(
                    cameraPublishContainerRef.current as HTMLElement,
                    state.cameraIntendedEnabled ? state.preferredCameraId : null,
                    state.microphoneIntendedEnabled ? state.preferredMicrophoneId : null,
                    isBackstageRoom ? "1280x720" : "640x480"
                );
            } catch (e) {
                console.error("Failed to join room", e);
                toast({
                    status: "error",
                    description: "Cannot connect to room",
                });
            } finally {
                setJoining(false);
            }
        }

        if (beginJoin && cancelJoin && completeJoin) {
            completeJoin.current = doJoinRoom;
            beginJoin();
        } else {
            doJoinRoom();
        }
    }, [
        vonage,
        onRoomJoined,
        state.cameraIntendedEnabled,
        state.preferredCameraId,
        state.microphoneIntendedEnabled,
        state.preferredMicrophoneId,
        isBackstageRoom,
        toast,
        beginJoin,
        cancelJoin,
        completeJoin,
    ]);

    const leaveRoom = useCallback(async () => {
        if (connected) {
            try {
                await vonage.disconnect();
                onRoomJoined?.(false);
            } catch (e) {
                console.warn("Failed to leave room", e);
            }
        }
        setJoining(false);
        dispatch({
            type: VonageRoomStateActionType.SetMicrophoneIntendedState,
            microphoneEnabled: false,
        });
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
        });
    }, [connected, dispatch, onRoomJoined, vonage]);

    useEffect(() => {
        if (stop) {
            leaveRoom().catch((e) => console.error("Failed to leave Vonage room", e));
        }
    }, [leaveRoom, stop]);

    useEffect(() => {
        async function fn() {
            if (connected) {
                try {
                    await vonage.publishCamera(
                        cameraPublishContainerRef.current as HTMLElement,
                        state.cameraIntendedEnabled ? state.preferredCameraId : null,
                        state.microphoneIntendedEnabled ? state.preferredMicrophoneId : null
                    );
                } catch (e) {
                    console.error("Failed to publish camera", e);
                    toast({
                        status: "error",
                        title: "Failed to publish camera",
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
    const othersCameraStreams = useMemo(() => streams.filter((s) => s.videoType === "camera" || !s.videoType), [
        streams,
    ]);

    const [enableStreams, setEnableStreams] = useState<string[] | null>(null);
    useEffect(() => {
        if (othersCameraStreams.length <= maxVideoStreams) {
            setEnableStreams(null);
        } else {
            const streamTimestamps = R.toPairs(streamLastActive) as [string, number][];
            // console.log(`${new Date().toISOString()}: Proceeding with computing enabled streams`, streamTimestamps);
            const activeStreams = R.sortWith(
                [R.descend((pair) => pair[1]), R.ascend((pair) => pair[0])],
                streamTimestamps
            ).map((pair) => pair[0]);
            const selectedActiveStreams = activeStreams.slice(0, Math.min(activeStreams.length, maxVideoStreams));

            const remainingSlots = maxVideoStreams - selectedActiveStreams.length;
            const topUpStreams = R.sortWith(
                [R.ascend((s) => s.connection.creationTime)],
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
    const sliceAndDice = useCallback(
        (cameraStreams: OT.Stream[], enableStreams: string[] | null, maxVideoStreams: number): OT.Stream[] => {
            console.log("Slicing and dicing");
            if (enableStreams) {
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
                return R.sortWith([R.ascend((s) => s.connection.creationTime)], cameraStreams);
            }
        },
        [sortedStreams, streamLastActive, streams]
    );

    useEffect(
        () =>
            setSortedStreams(
                screenSharingActive
                    ? sliceAndDice(othersCameraStreams, enableStreams, maxVideoStreams)
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
                <Box position="absolute" left="0.4rem" bottom="0.35rem" zIndex="200" width="100%">
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
                <Box position="relative" flex={`0 0 ${participantWidth}px`} w={participantWidth} h={participantWidth}>
                    <Box position="absolute" left="0" bottom="0" zIndex="200" width="100%" overflow="hidden">
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
                <Box position="relative" height="100%" width="100%" overflow="hidden">
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
                    <Box position="absolute" left="0.4rem" bottom="0.2rem" zIndex="200" width="100%" overflow="hidden">
                        <VonageOverlay
                            connectionData={JSON.stringify({ registrantId: registrant.id })}
                            microphoneEnabled={state.microphoneIntendedEnabled}
                        />
                    </Box>
                </Box>
            </Box>
        ),
        [registrant.id, camera, connected, participantWidth, state.microphoneIntendedEnabled]
    );

    const preJoin = useMemo(() => (connected ? <></> : <PreJoin cameraPreviewRef={cameraPreviewRef} />), [connected]);

    const nobodyElseAlert = useMemo(
        () =>
            connected && connections.length <= 1 ? (
                <Alert status="info">
                    <AlertIcon />
                    <AlertTitle>Nobody else has joined the room at the moment</AlertTitle>
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
                    !streams.find((stream) => stream.connection.connectionId === connection.connectionId)
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
                >
                    <Box position="absolute" left="0.4rem" bottom="0.2rem" zIndex="200" width="100%" overflow="hidden">
                        <VonageOverlay connectionData={connection.data} microphoneEnabled={false} />
                    </Box>
                    <PlaceholderImage connectionData={connection.data} />
                </Box>
            )),
        [otherUnpublishedConnections, participantWidth]
    );

    return (
        <Box width="100%">
            <Flex mt={4} justifyContent="center" alignItems="center" flexWrap="wrap" w="100%">
                {preJoin}
                {/* Use memo'ing the control bar causes the screenshare button to not update properly 🤔 */}
                <VonageRoomControlBar
                    onJoinRoom={joinRoom}
                    onLeaveRoom={leaveRoom}
                    onCancelJoinRoom={cancelJoin}
                    joining={joining}
                    joinRoomButtonText={joinRoomButtonText}
                    requireMicrophone={requireMicrophone}
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
