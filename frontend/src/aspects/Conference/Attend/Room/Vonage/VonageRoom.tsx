import { gql, useApolloClient } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useVonageRoom, VonageRoomStateActionType, VonageRoomStateProvider } from "../../../../Vonage/useVonageRoom";
import { RegistrantIdSpec, useRegistrants } from "../../../RegistrantsContext";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";
import { PreJoin } from "../PreJoin";
import type { DevicesProps } from "../VideoChat/PermissionInstructions";
import { CameraViewport } from "./Components/CameraViewport";
import Layout from "./Components/Layout";
import type { Viewport } from "./Components/LayoutTypes";
import SelfCameraComponent from "./Components/SelfCamera";
import SelfScreenComponent from "./Components/SelfScreen";
import VideoChatVideoPlayer from "./Components/VideoChatVideoPlayer";
import { useVonageComputedState } from "./useVonageComputedState";
import { StateType } from "./VonageGlobalState";
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
                            eventId={eventId ?? undefined}
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
    eventId,
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
    eventId?: string;
}): JSX.Element {
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);

    const currentRegistrant = useCurrentRegistrant();
    const [saveVonageRoomRecording] = useSaveVonageRoomRecordingMutation();

    const [playVideoElementId, setPlayVideoElementId] = useState<string | null>(null);

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

    const onPlayVideoReceived = useCallback((elementId: string) => {
        setPlayVideoElementId(null);
        setTimeout(() => {
            setPlayVideoElementId(elementId);
        }, 50 + Math.random() * 100);
    }, []);

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
            onPlayVideoReceived,
        });
    const { setAvailableStreams, refetchLayout } = useVonageLayout();

    useEffect(() => {
        if (connected) {
            refetchLayout();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    useEffect(() => {
        if (!connected) {
            setIsRecordingActive(false);
            setPlayVideoElementId(null);
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

    const streamActivities = useMemo<
        Map<
            string,
            React.MutableRefObject<{
                timestamp: number;
                talking: boolean;
            } | null>
        >
    >(() => new Map(), []);

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
                    const activityRef = React.createRef<{
                        timestamp: number;
                        talking: boolean;
                    } | null>();
                    streamActivities.set(stream.streamId, activityRef);

                    portalNode = {
                        node,
                        element: (
                            <portals.InPortal key={stream.streamId} node={node}>
                                <CameraViewport
                                    stream={stream}
                                    connection={stream.connection}
                                    isTalkingRef={activityRef}
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
        // These are excluded because they cause an infinite loop
        // that isn't necessary:
        //      streamPortalNodes,
        //      connectionPortalNodes,
        vonage.state,
        screen?.stream,
        camera?.stream,
        cameraPortalNode,
        screenPortalNode,
        streams,
        streamActivities,
        connections,
        userId,
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
                    eventId={eventId}
                />
            </Flex>
            {connected && playVideoElementId ? <VideoChatVideoPlayer elementId={playVideoElementId} /> : undefined}
            {connected ? (
                <Box position="relative" width="100%">
                    <Layout
                        viewports={viewports}
                        isRecordingMode={isBackstageRoom || isRecordingActive}
                        isBackstage={isBackstageRoom}
                        streamActivities={streamActivities}
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
