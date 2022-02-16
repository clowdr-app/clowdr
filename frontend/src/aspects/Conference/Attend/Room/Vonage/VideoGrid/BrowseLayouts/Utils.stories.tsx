import { Center, Text } from "@chakra-ui/react";
import type { Stream } from "@opentok/client";
import * as R from "ramda";
import React from "react";
import * as portals from "react-reverse-portal";
import { v4 as uuidv4 } from "uuid";
import type { CameraViewportProps } from "../../Components/CameraViewport";
import type { Viewport } from "../../Components/LayoutTypes";

export function makeViewports(count: number): [viewports: Viewport[], inPortals: JSX.Element[]] {
    const viewports = R.range(0, count).map((idx) => makeViewport(idx));
    return [viewports.map((x) => x[0]), viewports.map((x) => x[1])];
}

export function makeViewport(seed: number): [viewport: Viewport, inPortal: JSX.Element] {
    const node = portals.createHtmlPortalNode({
        attributes: {
            style: "width: 100%; height: 100%",
        },
    });

    const inPortal = (
        <portals.InPortal key={seed} node={node}>
            <DummyCameraViewport
                stream={
                    {
                        streamId: seed.toString(),
                    } as Stream
                }
            />
        </portals.InPortal>
    );

    return [
        {
            component: node,
            streamId: uuidv4(),
            connectionId: uuidv4(),
            isSelf: false,
            joinedAt: Date.now(),
            type: "camera",
            associatedIds: [],
        },
        inPortal,
    ];
}

export function DummyCameraViewport(props: CameraViewportProps) {
    return (
        <Center bgColor="#eee" border="1px solid black" h="100%" w="100%">
            <Text>Viewport {props.stream?.streamId ?? "viewport"}</Text>
        </Center>
    );
}
