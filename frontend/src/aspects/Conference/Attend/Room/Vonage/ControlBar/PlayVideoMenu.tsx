import { CloseIcon } from "@chakra-ui/icons";
import {
    IconButton,
    Menu,
    MenuButton,
    MenuDivider,
    MenuGroup,
    MenuItem,
    MenuList,
    Portal,
    Tooltip,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import * as R from "ramda";
import React, { useContext, useMemo } from "react";
import { gql } from "urql";
import { useGetEventVideosQuery, useGetRoomVideosQuery } from "../../../../../../generated/graphql";
import FAIcon from "../../../../../Chakra/FAIcon";
import { makeContext } from "../../../../../GQL/make-context";
import { maybeCompare } from "../../../../../Utils/maybeCompare";
import { VonageVideoPlaybackContext } from "../VideoPlayback/VonageVideoPlaybackContext";

gql`
    query GetEventVideos($eventId: uuid!) @cached {
        schedule_Event_by_pk(id: $eventId) {
            id
            itemId
            presentations {
                item {
                    id
                    title
                    elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE] } }) {
                        id
                        name
                        itemId
                        typeName
                    }
                }
            }
            item {
                id
                title
                elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE] } }) {
                    id
                    name
                    itemId
                    typeName
                }
            }
            exhibition {
                id
                items {
                    id
                    priority
                    exhibitionId
                    itemId
                    item {
                        id
                        title
                        elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE] } }) {
                            id
                            name
                            itemId
                            typeName
                        }
                    }
                }
            }
        }
    }

    query GetRoomVideos($roomId: uuid!) @cached {
        room_Room_by_pk(id: $roomId) {
            id
            item {
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
    const { sendCommand, latestCommand } = useContext(VonageVideoPlaybackContext);
    const [eventResponse] = useGetEventVideosQuery({
        variables: {
            eventId,
        },
        pause: !eventId,
    });
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId]
    );
    const [roomResponse] = useGetRoomVideosQuery({
        variables: {
            roomId,
        },
        pause: !roomId,
        context,
    });

    const eventMenuItems = useMemo(() => {
        const items = R.uniqBy(
            (x) => x.id,
            [
                ...(eventResponse.data?.schedule_Event_by_pk?.item
                    ? [eventResponse.data.schedule_Event_by_pk.item]
                    : []),
                ...(eventResponse.data?.schedule_Event_by_pk?.presentations?.flatMap((x) => (x.item ? [x.item] : [])) ??
                    []),
            ]
        );

        return items.flatMap(
            (item) =>
                item?.elements.map((element) => (
                    <MenuItem
                        key={element.id}
                        onClick={() => {
                            sendCommand({
                                type: "video",
                                currentTimeSeconds: 0,
                                elementId: element.id,
                                playing: true,
                                volume: 1,
                            });
                        }}
                    >
                        {item.title}: {element.name}
                    </MenuItem>
                )) ?? []
        );
    }, [
        eventResponse.data?.schedule_Event_by_pk?.item,
        eventResponse.data?.schedule_Event_by_pk?.presentations,
        sendCommand,
    ]);

    const exhibitionMenuItems = useMemo(() => {
        const exhibitionItems = R.sort(
            (x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b),
            eventResponse?.data?.schedule_Event_by_pk?.exhibition?.items ?? []
        );

        return exhibitionItems
            .filter((item) => item.item.id !== item.id)
            .flatMap((item) =>
                item.item.elements.map((element) => (
                    <MenuItem
                        key={element.id}
                        onClick={() => {
                            sendCommand({
                                type: "video",
                                currentTimeSeconds: 0,
                                elementId: element.id,
                                playing: true,
                                volume: 1,
                            });
                        }}
                    >
                        {item.item.title}: {element.name}
                    </MenuItem>
                ))
            );
    }, [eventResponse?.data?.schedule_Event_by_pk?.exhibition?.items, sendCommand]);

    const roomItemMenuItems = useMemo(() => {
        const roomItem = roomResponse.data?.room_Room_by_pk?.item;

        return roomItem
            ? roomItem.elements.map((element) => (
                  <MenuItem
                      key={element.id}
                      onClick={() => {
                          sendCommand({
                              type: "video",
                              currentTimeSeconds: 0,
                              elementId: element.id,
                              playing: true,
                              volume: 1,
                          });
                      }}
                  >
                      {roomItem.title}: {element.name}
                  </MenuItem>
              ))
            : [];
    }, [roomResponse.data?.room_Room_by_pk?.item, sendCommand]);

    const menuItems = useMemo(() => {
        const currentlyPlaying = latestCommand?.command?.type === "video";
        const anythingAvailable =
            currentlyPlaying || eventMenuItems.length || exhibitionMenuItems.length || roomItemMenuItems.length;
        return anythingAvailable ? (
            <>
                {latestCommand?.command?.type === "video" ? (
                    <>
                        <MenuItem
                            key="stop"
                            onClick={() =>
                                sendCommand({
                                    type: "no-video",
                                })
                            }
                            icon={<CloseIcon />}
                        >
                            Stop video
                        </MenuItem>
                        <MenuDivider />
                    </>
                ) : undefined}
                {R.intersperse(<MenuDivider />, [
                    ...(eventMenuItems.length
                        ? [
                              <MenuGroup key="Event videos" title="Event videos">
                                  {eventMenuItems}
                              </MenuGroup>,
                          ]
                        : []),
                    ...(exhibitionMenuItems.length
                        ? [
                              <MenuGroup key="Exhibition videos" title="Exhibition videos">
                                  {exhibitionMenuItems}
                              </MenuGroup>,
                          ]
                        : []),
                    ...(roomItemMenuItems.length
                        ? [
                              <MenuGroup key="Room videos" title="Room videos">
                                  {roomItemMenuItems}
                              </MenuGroup>,
                          ]
                        : []),
                ])}
            </>
        ) : (
            <MenuItem isDisabled={true}>No videos available</MenuItem>
        );
    }, [latestCommand?.command.type, eventMenuItems, exhibitionMenuItems, roomItemMenuItems, sendCommand]);

    return (
        <Menu>
            <Tooltip label="Play a video">
                <MenuButton
                    as={IconButton}
                    size="sm"
                    colorScheme="RoomControlBarButton"
                    isLoading={eventResponse.fetching}
                    icon={<FAIcon iconStyle="s" icon="play-circle" />}
                    aria-label="Play video"
                />
            </Tooltip>
            <Portal>
                <MenuList zIndex="1000000" overflow="auto" maxH="50vh" maxW="50vh">
                    {menuItems}
                </MenuList>
            </Portal>
        </Menu>
    );
}
