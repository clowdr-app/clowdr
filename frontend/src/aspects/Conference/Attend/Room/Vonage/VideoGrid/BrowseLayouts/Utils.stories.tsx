import { Center, Text, useColorModeValue } from "@chakra-ui/react";
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
    const text = useColorModeValue("gray.900", "gray.50");
    const background = useColorModeValue("gray.50", "gray.900");

    return (
        <Center bgColor={background} borderWidth={1} borderStyle="solid" borderColor={text} h="100%" w="100%">
            <Text color={text}>Viewport {props.stream?.streamId ?? "viewport"}</Text>
        </Center>
    );
}
