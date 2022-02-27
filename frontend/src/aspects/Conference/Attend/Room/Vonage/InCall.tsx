import { Box, Flex, VStack } from "@chakra-ui/react";
import React, { useContext, useEffect, useMemo } from "react";
import * as portals from "react-reverse-portal";
import { validate } from "uuid";
import { useUserId } from "../../../../Auth";
import type { RegistrantIdSpec } from "../../../RegistrantsContext";
import { useRegistrants } from "../../../RegistrantsContext";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { CameraViewport } from "./Components/CameraViewport";
import type { Viewport } from "./Components/LayoutTypes";
import SelfCameraComponent from "./Components/SelfCamera";
import SelfScreenComponent from "./Components/SelfScreen";
import { VonageRoomControlBar } from "./ControlBar/VonageRoomControlBar";
import type { AvailableStream } from "./State/useVonageBroadcastLayout";
import { DisplayType } from "./State/useVonageDisplay";
import { VonageComputedStateContext } from "./State/VonageComputedStateContext";
import { StateType } from "./State/VonageGlobalState";
import { useVonageLayout } from "./State/VonageLayoutProvider";
import { useVonageRoom } from "./State/VonageRoomProvider";
import { Browse } from "./VideoGrid/Browse";
import Layout from "./VideoGrid/Layout";
import VideoChatVideoPlayer from "./VideoPlayback/VideoChatVideoPlayer";
import { VonageVideoPlaybackContext } from "./VideoPlayback/VonageVideoPlaybackContext";

export function InCall(): JSX.Element {
    const registrant = useCurrentRegistrant();
    const { state, settings } = useVonageRoom();
    const { camera, connected, connections, streams, screen, vonage } = useContext(VonageComputedStateContext);
    const {
        layout: { setAvailableStreams, refetchLayout },
        display,
    } = useVonageLayout();

    const userId = useUserId();
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
                if (screen?.stream && screen.stream.hasVideo) {
                    result.push({
                        connectionId: vonage.state.session.connection.connectionId,
                        streamId: screen.stream?.streamId,
                        type: "screen",
                        registrantName: registrant.displayName,
                    });
                }

                if (camera?.stream && camera.stream.hasVideo) {
                    result.push({
                        connectionId: vonage.state.session.connection.connectionId,
                        streamId: camera?.stream?.streamId,
                        type: "camera",
                        registrantName: registrant.displayName,
                    });
                }
            }
        }
        for (const stream of streams) {
            // TODO: As and when we can support putting a profile picture/placeholder image
            //       in the recorded layout, AND auto-swapping in/out a video feed when camera
            //       is enabled / disabled, then we can remove this condition
            if (stream.hasVideo) {
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
        }
        // TODO: As and when we can support putting a profile picture/placeholder image
        //       in the recorded layout, AND auto-swapping in/out a video feed when camera
        //       is enabled / disabled, then we can re-enable this code
        // for (const connection of connections) {
        //     if (
        //         userId &&
        //         !connection.data.includes(userId) &&
        //         !streams.find(
        //             (stream) =>
        //                 stream.connection.connectionId === connection.connectionId &&
        //                 (!stream.videoType || stream.videoType === "camera")
        //         )
        //     ) {
        //         let registrantId: string | undefined;
        //         try {
        //             const data = JSON.parse(connection.data);
        //             registrantId =
        //                 data["registrantId"] && validate(data["registrantId"]) ? data["registrantId"] : undefined;
        //         } catch {
        //             // None
        //         }
        //         result.push({
        //             connectionId: connection.connectionId,
        //             registrantName: registrantId
        //                 ? registrants.find((reg) => reg.id === registrantId)?.displayName
        //                 : undefined,
        //             type: "camera",
        //         });
        //     }
        // }
        setAvailableStreams(result);
    }, [
        connections,
        setAvailableStreams,
        registrants,
        streams,
        userId,
        vonage.state,
        screen?.stream,
        camera?.stream,
        registrant.displayName,
    ]);

    const screenPortalNode = React.useMemo(() => portals.createHtmlPortalNode(), []);
    const cameraPortalNode = React.useMemo(() => portals.createHtmlPortalNode(), []);
    const [streamPortalNodes, setStreamPortalNodes] = React.useState(
        new Map<string, { node: portals.HtmlPortalNode<typeof CameraViewport>; element: JSX.Element }>()
    );
    const [connectionPortalNodes, setConnectionPortalNodes] = React.useState(
        new Map<string, { node: portals.HtmlPortalNode<typeof CameraViewport>; element: JSX.Element }>()
    );

    const streamActivities = useMemo<
        Map<
            string,
            React.MutableRefObject<{
                timestamp: number;
                talking: boolean;
            } | null>
        >
    >(() => new Map(), []);

    const viewports = useMemo<Viewport[]>(() => {
        const result: Viewport[] = [];
        const streamPortalNodesResult = new Map<
            string,
            { node: portals.HtmlPortalNode<typeof CameraViewport>; element: JSX.Element }
        >(streamPortalNodes);
        const connectionPortalNodesResult = new Map<
            string,
            { node: portals.HtmlPortalNode<typeof CameraViewport>; element: JSX.Element }
        >(connectionPortalNodes);

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

    useEffect(() => {
        if (connected) {
            refetchLayout();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected]);

    const displayEl = useMemo(() => {
        switch (display.actualDisplay.type) {
            case DisplayType.Browse:
                return <Browse streamActivities={streamActivities} viewports={viewports} />;
            case DisplayType.BroadcastLayout:
                return (
                    <Layout
                        viewports={viewports}
                        allowedToControlLayout={Boolean(settings.canControlRecordingAs.size)}
                    />
                );
        }
    }, [display.actualDisplay.type, settings.canControlRecordingAs, streamActivities, viewports]);

    const videoPlayback = useContext(VonageVideoPlaybackContext);

    return (
        <>
            {connected ? (
                <VStack h="100%" w="100%" zIndex={1} alignItems="stretch" overflow="hidden" spacing={0}>
                    {videoPlayback.latestCommand?.command?.type === "video" ? (
                        <Box flexBasis={0} flexGrow={1.5} flexShrink={1} minH="10em" w="100%" p={2}>
                            <VideoChatVideoPlayer />
                        </Box>
                    ) : undefined}
                    <Flex
                        flexDirection="column"
                        flexBasis={0}
                        flexGrow={1}
                        flexShrink={1}
                        minH="10em"
                        w="100%"
                        overflow="hidden"
                    >
                        {displayEl}
                    </Flex>
                    <VonageRoomControlBar />
                </VStack>
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
                    isBackstageRoom={settings.isBackstageRoom}
                />
            </portals.InPortal>
        </>
    );
}
