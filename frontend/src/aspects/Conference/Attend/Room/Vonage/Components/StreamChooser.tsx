import { Button, chakra, Flex, HStack, Menu, MenuButton, MenuItem, MenuList, Portal } from "@chakra-ui/react";
import type { ParticipantPlacement } from "@clowdr-app/shared-types/build/vonage";
import * as R from "ramda";
import React, { useCallback, useMemo } from "react";
import FAIcon from "../../../../../Icons/FAIcon";
import { maybeCompare } from "../../../../../Utils/maybeSort";
import { useVonageLayout } from "../VonageLayoutProvider";

export default function StreamChooser({
    centered,
    positionKey,
    isRecordingMode,
}: {
    centered: boolean;
    positionKey: string;
    isRecordingMode: boolean;
}): JSX.Element {
    const {
        availableStreams,
        layout: { layout },
        updateLayout,
        saveLayout,
        layoutChooser_isOpen,
    } = useVonageLayout();

    const changeLayout = useCallback(
        (connectionId: string | null, streamId?: string | null) => {
            const newLayout: any = {
                ...layout,
                [positionKey]: !connectionId ? null : streamId ? { streamId } : { connectionId },
            };
            if (connectionId) {
                for (let idx = 0; idx < 6; idx++) {
                    const key = "position" + idx;
                    if (key in newLayout && key !== positionKey) {
                        const placement: ParticipantPlacement = newLayout[key];
                        if (placement) {
                            if ("streamId" in placement && streamId) {
                                if (placement.streamId === streamId) {
                                    newLayout[key] = null;
                                }
                            }

                            if ("connectionId" in placement) {
                                if (placement.connectionId === connectionId) {
                                    newLayout[key] = null;
                                }
                            }
                        }
                    }
                }
            }
            if (!layoutChooser_isOpen) {
                saveLayout({ layout: newLayout, createdAt: Date.now() });
            } else {
                updateLayout({ layout: newLayout, createdAt: Date.now() });
            }
        },
        [layout, layoutChooser_isOpen, positionKey, saveLayout, updateLayout]
    );

    const availableOptions = useMemo(() => {
        const result: JSX.Element[] = [];

        const sorted = R.sortWith(
            [
                (x, y) => maybeCompare(x.registrantName, y.registrantName, (a, b) => a.localeCompare(b)),
                (x, y) => x.type.localeCompare(y.type),
            ],
            availableStreams
        );
        for (const stream of sorted) {
            if (stream.streamId || !isRecordingMode) {
                result.push(
                    <MenuItem
                        key={stream.streamId ?? stream.connectionId}
                        onClick={() => {
                            changeLayout(stream.connectionId, stream.streamId);
                        }}
                        icon={<FAIcon iconStyle="s" icon={stream.type === "screen" ? "desktop" : "video"} />}
                    >
                        {stream.registrantName ?? "<Loading name>"}&nbsp;
                        {stream.type === "camera" ? "(Camera)" : "(Screen-share)"}
                    </MenuItem>
                );
            }
        }

        return result;
    }, [availableStreams, isRecordingMode, changeLayout]);

    return (
        <Flex
            pos="absolute"
            w={centered ? "100%" : "auto"}
            h={centered ? "100%" : "auto"}
            alignItems={centered ? "center" : "flex-start"}
            justifyContent={centered ? "center" : "flex-end"}
            zIndex={250}
            bottom={centered ? 0 : 1}
            right={centered ? 0 : 1}
        >
            <Menu placement="top-end">
                <MenuButton as={Button} size="xs" colorScheme="gray" opacity={1}>
                    <HStack spacing={2}>
                        <FAIcon iconStyle="s" icon="sync-alt" />
                        {centered ? <chakra.span>Choose participant</chakra.span> : undefined}
                    </HStack>
                </MenuButton>
                <Portal>
                    <MenuList zIndex={10000}>
                        <MenuItem
                            onClick={() => {
                                changeLayout(null);
                            }}
                        >
                            None
                        </MenuItem>
                        {availableOptions}
                    </MenuList>
                </Portal>
            </Menu>
        </Flex>
    );
}
