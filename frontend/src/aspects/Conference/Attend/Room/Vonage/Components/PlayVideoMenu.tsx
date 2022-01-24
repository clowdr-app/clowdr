import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Button, chakra, Menu, MenuButton, MenuItem, MenuList, Portal } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useGetEventVideosQuery, useGetRoomVideosQuery } from "../../../../../../generated/graphql";
import { maybeCompare } from "../../../../../Utils/maybeSort";
import { useVonageGlobalState } from "../VonageGlobalStateProvider";
import { FormattedMessage, useIntl } from "react-intl";

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

    query GetRoomVideos($roomId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            id
            originatingItem {
                id
                title
                elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE] }, hasBeenSubmitted: { _eq: true } }) {
                    id
                    name
                }
            }
        }
    }
`;

export default function PlayVideoMenuButton({
    roomId,
    eventId,
}: {
    roomId: string | undefined;
    eventId: string | undefined;
}): JSX.Element {
    const vonage = useVonageGlobalState();
    const eventResponse = useGetEventVideosQuery({
        variables: {
            eventId,
        },
        skip: !eventId,
    });
    const roomResponse = useGetRoomVideosQuery({
        variables: {
            roomId,
        },
        skip: !roomId,
    });
    const { videoElementIds, videoElementMenuItems } = useMemo(() => {
        const ids: string[] = [];
        const videoElementMenuItems: JSX.Element[] = [];

        if (eventResponse.data?.schedule_Event_by_pk) {
            if (eventResponse.data.schedule_Event_by_pk.item) {
                const item = eventResponse.data.schedule_Event_by_pk.item;
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

            if (eventResponse.data.schedule_Event_by_pk.exhibition) {
                const items = R.sort(
                    (x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b),
                    eventResponse.data.schedule_Event_by_pk.exhibition.items
                );
                for (const { item } of items) {
                    if (item.id !== eventResponse.data.schedule_Event_by_pk.item?.id) {
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

        if (roomResponse.data?.room_Room_by_pk) {
            if (roomResponse.data.room_Room_by_pk.originatingItem) {
                const item = roomResponse.data.room_Room_by_pk.originatingItem;
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

        return {
            videoElementIds: ids,
            videoElementMenuItems,
        };
    }, [eventResponse.data?.schedule_Event_by_pk, roomResponse.data?.room_Room_by_pk, vonage]);

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
                isLoading={eventResponse.loading}
                isDisabled={!videoElementIds.length}
            >
                <chakra.span>
                    <FormattedMessage
                        id="Conference.Attend.Room.Vonage.Components.PlayVideoMenu.PlayPreRecorded"
                        defaultMessage="Play pre-recorded video"
                    />
                </chakra.span>
                <ChevronDownIcon ml={2} />
            </MenuButton>
            <Portal>
                <MenuList zIndex="1000000" overflow="auto" maxH="50vh" maxW="50vh">
                    {videoElementMenuItems?.length ? videoElementMenuItems : <FormattedMessage id="Conference.Attend.Room.Vonage.Components.PlayVideoMenu.NoVideosAvaliable" defaultMessage="No videos avaliable" />}
                </MenuList>
            </Portal>
        </Menu>
    );
}
