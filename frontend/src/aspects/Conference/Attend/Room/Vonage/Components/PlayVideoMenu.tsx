import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, chakra, Menu, MenuButton, MenuItem, MenuList, Portal } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useGetEventVideosQuery } from "../../../../../../generated/graphql";
import { maybeCompare } from "../../../../../Utils/maybeSort";
import { useVonageGlobalState } from "../VonageGlobalStateProvider";

gql`
    query GetEventVideos($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            item {
                id
                title
                elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE] }, hasBeenSubmitted: { _eq: true } }) {
                    id
                    name
                }
            }
            exhibition {
                id
                items {
                    id
                    priority
                    item {
                        id
                        title
                        elements(
                            where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE] }, hasBeenSubmitted: { _eq: true } }
                        ) {
                            id
                            name
                        }
                    }
                }
            }
        }
    }
`;

export default function PlayVideoMenuButton({ eventId }: { eventId: string }): JSX.Element {
    const vonage = useVonageGlobalState();
    const response = useGetEventVideosQuery({
        variables: {
            eventId,
        },
    });
    const { videoElementIds, videoElementMenuItems } = useMemo(() => {
        const ids: string[] = [];
        const videoElementMenuItems: JSX.Element[] = [];

        if (response.data?.schedule_Event_by_pk) {
            if (response.data.schedule_Event_by_pk.item) {
                const item = response.data.schedule_Event_by_pk.item;
                for (const element of item.elements) {
                    ids.push(element.id);
                    videoElementMenuItems.push(
                        <MenuItem
                            key={element.id}
                            onClick={() => {
                                vonage.startPlayingVideo(element.id);
                            }}
                        >
                            {item.title}: {element.name}
                        </MenuItem>
                    );
                }
            }

            if (response.data.schedule_Event_by_pk.exhibition) {
                const items = R.sort(
                    (x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b),
                    response.data.schedule_Event_by_pk.exhibition.items
                );
                for (const { item } of items) {
                    if (item.id !== response.data.schedule_Event_by_pk.item?.id) {
                        for (const element of item.elements) {
                            ids.push(element.id);
                            videoElementMenuItems.push(
                                <MenuItem
                                    key={element.id}
                                    onClick={() => {
                                        vonage.startPlayingVideo(element.id);
                                    }}
                                >
                                    {item.title}: {element.name}
                                </MenuItem>
                            );
                        }
                    }
                }
            }
        }

        return {
            videoElementIds: ids,
            videoElementMenuItems,
        };
    }, [response.data?.schedule_Event_by_pk, vonage]);

    return (
        <Menu>
            <MenuButton
                as={Button}
                size="sm"
                flexGrow={1}
                colorScheme="SecondaryActionButton"
                onClick={() => {
                    // TODO
                }}
                isLoading={response.loading}
                isDisabled={!videoElementIds.length}
            >
                <chakra.span>Play pre-recorded video</chakra.span>
                <ChevronDownIcon ml={2} />
            </MenuButton>
            <Portal>
                <MenuList zIndex="1000000" overflow="auto" maxH="50vh" maxW="50vh">
                    {videoElementMenuItems}
                </MenuList>
            </Portal>
        </Menu>
    );
}
